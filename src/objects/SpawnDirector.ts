/**
 * SpawnDirector.ts — the mirrored spawn stream. ONE random event stream
 * drives BOTH halves: same item, same cell, same instant, so the duel is
 * a pure reflex comparison (no luck complaints, and dad can glance across
 * to coach). A cell is eligible only while it's free on both halves — a
 * tapped-away item leaves its cell reserved until its twin resolves too.
 */
import { CELL_COUNT, type ItemType, ROUND, SPAWN } from '../layout';
import type { PlayerHalf } from './PlayerHalf';

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

export class SpawnDirector {
  private readonly rng: () => number;
  private readonly halves: readonly [PlayerHalf, PlayerHalf];
  private sinceSpawnMs = 0;
  private elapsedMs = 0;

  constructor(halves: readonly [PlayerHalf, PlayerHalf], seed = Date.now()) {
    this.halves = halves;
    this.rng = mulberry32(seed);
  }

  /** Called only while the round is running. */
  update(delta: number): void {
    this.elapsedMs += delta;
    this.sinceSpawnMs += delta;
    // spawn gap ramps across the round, eased so it back-loads (rampExp>1):
    // calm opening, frantic finish.
    const t = Math.min(1, this.elapsedMs / ROUND.durationMs);
    const eased = Math.pow(t, SPAWN.rampExp);
    const gap = SPAWN.startGapMs + (SPAWN.endGapMs - SPAWN.startGapMs) * eased;
    if (this.sinceSpawnMs < gap) return;

    const cell = this.pickFreeCell();
    if (cell === undefined) {
      // board momentarily full on one side — retry shortly, don't skip
      this.sinceSpawnMs = gap - SPAWN.retryGapMs;
      return;
    }
    this.sinceSpawnMs = 0;
    const itemType = this.pickType();
    for (const half of this.halves) half.spawn(itemType, cell);
  }

  private pickFreeCell(): number | undefined {
    const a = this.halves[0].freeCells();
    const b = this.halves[1].freeCells();
    const free: number[] = [];
    for (let i = 0; i < CELL_COUNT; i++) {
      if (a[i] && b[i]) free.push(i);
    }
    if (free.length === 0) return undefined;
    return free[Math.floor(this.rng() * free.length)];
  }

  private pickType(): ItemType {
    const r = this.rng();
    let acc = 0;
    for (const [itemType, weight] of Object.entries(SPAWN.weights) as [ItemType, number][]) {
      acc += weight;
      if (r < acc) return itemType;
    }
    return 'tap'; // float-sum fallback
  }
}
