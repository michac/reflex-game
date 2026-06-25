/**
 * SpawnDirector.ts — independent per-player adaptive spawn lanes. Each half
 * owns its own PRNG, cell choice, spawn timer, target CPS, and CPS velocity.
 */
import Phaser from 'phaser';
import { CELL_COUNT, type ItemType, SPAWN } from '../layout';
import type { PlayerHalf, Seat } from './PlayerHalf';

type ItemWeights = Record<ItemType, number>;

export type SpawnLaneDebug = {
  targetCps: number;
  cpsVelocity: number;
  spawnGapMs: number;
  lifeScale: number;
  weights: ItemWeights;
};

export type SpawnDebugState = Record<Seat, SpawnLaneDebug>;

/** Tiny deterministic PRNG (mulberry32) — plenty for spawn variety. */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function progressFor(targetCps: number): number {
  return Phaser.Math.Clamp(
    (targetCps - SPAWN.startCps) / (SPAWN.maxCps - SPAWN.startCps),
    0,
    1
  );
}

function weightsFor(targetCps: number): ItemWeights {
  const t = progressFor(targetCps);
  return {
    tap: Phaser.Math.Linear(SPAWN.easyWeights.tap, SPAWN.hardWeights.tap, t),
    multi2: Phaser.Math.Linear(SPAWN.easyWeights.multi2, SPAWN.hardWeights.multi2, t),
    multi3: Phaser.Math.Linear(SPAWN.easyWeights.multi3, SPAWN.hardWeights.multi3, t),
    bomb: Phaser.Math.Linear(SPAWN.easyWeights.bomb, SPAWN.hardWeights.bomb, t),
  };
}

function expectedLoadPerSpawn(weights: ItemWeights): number {
  let totalWeight = 0;
  let totalLoad = 0;
  for (const [itemType, weight] of Object.entries(weights) as [ItemType, number][]) {
    totalWeight += weight;
    totalLoad += weight * SPAWN.loadCost[itemType];
  }
  return totalLoad / totalWeight;
}

function spawnGapMs(targetCps: number, weights: ItemWeights): number {
  const raw = (expectedLoadPerSpawn(weights) / targetCps) * 1000;
  return Phaser.Math.Clamp(raw, SPAWN.minGapMs, SPAWN.maxGapMs);
}

function lifeScaleFor(targetCps: number): number {
  return Phaser.Math.Linear(1, SPAWN.minTargetLifeScale, progressFor(targetCps));
}

class SpawnLane {
  private readonly rng: () => number;
  private readonly half: PlayerHalf;
  private sinceSpawnMs = 0;
  private targetCps: number = SPAWN.startCps;
  private cpsVelocity: number = 0;
  private currentGapMs: number = spawnGapMs(SPAWN.startCps, weightsFor(SPAWN.startCps));

  constructor(half: PlayerHalf, seed: number) {
    this.half = half;
    this.rng = mulberry32(seed);
  }

  update(delta: number): void {
    const dt = delta / 1000;
    this.cpsVelocity = Math.min(
      SPAWN.maxCpsVelocity,
      this.cpsVelocity + SPAWN.cpsAcceleration * dt
    );
    this.targetCps = Math.min(SPAWN.maxCps, this.targetCps + this.cpsVelocity * dt);

    const weights = weightsFor(this.targetCps);
    this.currentGapMs = spawnGapMs(this.targetCps, weights);
    this.sinceSpawnMs += delta;
    if (this.sinceSpawnMs < this.currentGapMs) return;

    const cell = this.pickFreeCell();
    if (cell === undefined) {
      this.sinceSpawnMs = Math.max(0, this.currentGapMs - SPAWN.retryGapMs);
      return;
    }

    this.sinceSpawnMs = 0;
    this.half.spawn(this.pickType(weights), cell, lifeScaleFor(this.targetCps));
  }

  reportMistake(): void {
    this.cpsVelocity = 0;
  }

  debugState(): SpawnLaneDebug {
    const weights = weightsFor(this.targetCps);
    return {
      targetCps: this.targetCps,
      cpsVelocity: this.cpsVelocity,
      spawnGapMs: this.currentGapMs,
      lifeScale: lifeScaleFor(this.targetCps),
      weights,
    };
  }

  private pickFreeCell(): number | undefined {
    const availability = this.half.freeCells();
    const free: number[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      if (availability[i]) free.push(i);
    }
    if (free.length === 0) return undefined;
    return free[Math.floor(this.rng() * free.length)];
  }

  private pickType(weights: ItemWeights): ItemType {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    const r = this.rng() * total;
    let acc = 0;
    for (const [itemType, weight] of Object.entries(weights) as [ItemType, number][]) {
      acc += weight;
      if (r < acc) return itemType;
    }
    return 'tap'; // float-sum fallback
  }
}

export class SpawnDirector {
  private readonly lanes: Record<Seat, SpawnLane>;

  constructor(halves: Record<Seat, PlayerHalf>, seed = Date.now()) {
    this.lanes = {
      top: new SpawnLane(halves.top, seed ^ 0x51f15e),
      bottom: new SpawnLane(halves.bottom, seed ^ 0xb0770d),
    };
  }

  /** Called only while the round is running. */
  update(delta: number): void {
    this.lanes.top.update(delta);
    this.lanes.bottom.update(delta);
  }

  reportMistake(seat: Seat): void {
    this.lanes[seat].reportMistake();
  }

  debugState(): SpawnDebugState {
    return {
      top: this.lanes.top.debugState(),
      bottom: this.lanes.bottom.debugState(),
    };
  }
}
