/**
 * PlayerHalf.ts — one player's half of the screen: the rotated-container
 * trick from Star Slingers applied to a whole playfield. The container's
 * origin sits ON the divider; P1's container is rotated 180°, so every
 * child (grid, HUD, items, score pops) reads toward the top player with
 * zero per-seat layout code.
 */
import Phaser from 'phaser';
import {
  BOMB,
  CELL_COUNT,
  cellCenter,
  DIVIDER_Y,
  GAME_WIDTH,
  HALF_HEIGHT,
  type ItemType,
} from '../layout';
import { COLORS, CSS, FONTS } from '../tokens';
import { Hud } from './Hud';
import { Item } from './Item';
import { TEX, type PlayerKey } from './textures';

export type Seat = 'top' | 'bottom';

export class PlayerHalf {
  readonly seat: Seat;
  readonly container: Phaser.GameObjects.Container;
  readonly hud: Hud;
  score = 0;

  private readonly scene: Phaser.Scene;
  private readonly player: PlayerKey;
  private readonly items = new Set<Item>();
  private readonly flash: Phaser.GameObjects.Rectangle;
  private stunnedUntil = 0;
  private nowMs = 0;

  constructor(scene: Phaser.Scene, seat: Seat) {
    this.scene = scene;
    this.seat = seat;
    this.player = seat === 'top' ? 'p1' : 'p2';

    // Bottom container at (0, divider); top at (W, divider) rotated 180° —
    // local (x, y) maps to screen (W - x, divider - y) for the top seat.
    this.container = scene.add.container(seat === 'top' ? GAME_WIDTH : 0, DIVIDER_Y);
    if (seat === 'top') this.container.setAngle(180);

    for (let i = 0; i < CELL_COUNT; i++) {
      const c = cellCenter(i);
      this.container.add(scene.add.image(c.x, c.y, TEX.cell));
    }
    this.hud = new Hud(scene, this.container, this.player);

    // Stun flash: covers the whole half, kept above items via bringToTop.
    this.flash = scene.add.rectangle(
      GAME_WIDTH / 2,
      HALF_HEIGHT / 2,
      GAME_WIDTH,
      HALF_HEIGHT,
      COLORS.danger,
      0
    );
    this.container.add(this.flash);
  }

  /** Per-cell freedom — the SpawnDirector intersects both halves so the
   *  mirrored stream only uses cells empty on BOTH sides. */
  freeCells(): boolean[] {
    const free = new Array<boolean>(CELL_COUNT).fill(true);
    for (const item of this.items) {
      if (item.isLive) free[item.cellIndex] = false;
    }
    return free;
  }

  spawn(itemType: ItemType, cellIndex: number): void {
    const c = cellCenter(cellIndex);
    const item = new Item(this.scene, c.x, c.y, itemType, cellIndex, this.player, (it) =>
      this.items.delete(it)
    );
    this.items.add(item);
    this.container.add(item);
    this.container.bringToTop(this.flash);
  }

  /** Screen-space tap routed here by the scene during play. */
  tapAt(screenX: number, screenY: number): void {
    if (this.nowMs < this.stunnedUntil) return; // bombed — taps ignored
    const lx = this.seat === 'top' ? GAME_WIDTH - screenX : screenX;
    const ly = this.seat === 'top' ? DIVIDER_Y - screenY : screenY - DIVIDER_Y;

    let hit: Item | undefined;
    let best = Number.POSITIVE_INFINITY;
    for (const item of this.items) {
      if (!item.hits(lx, ly)) continue;
      const d = Phaser.Math.Distance.Between(lx, ly, item.x, item.y);
      if (d < best) {
        best = d;
        hit = item;
      }
    }
    if (!hit) return;

    const { x, y } = hit;
    const result = hit.tap();
    if (result.kind === 'bomb') {
      this.score = Math.max(0, this.score - BOMB.penalty); // never below 0 — gentle at 5
      this.hud.setScore(this.score);
      this.popText(x, y, `-${BOMB.penalty}`);
      this.stun();
    } else if (result.kind === 'complete') {
      this.score += result.points;
      this.hud.setScore(this.score);
      this.ripple(x, y);
      this.popText(x, y - 26, `+${result.points}`);
    } else {
      this.ripple(x, y); // multi progress — feedback without points
    }
  }

  update(delta: number): void {
    this.nowMs += delta;
    for (const item of this.items) item.step(delta);
  }

  private stun(): void {
    this.stunnedUntil = this.nowMs + BOMB.stunMs;
    this.flash.setFillStyle(COLORS.danger, 0.35);
    this.scene.tweens.add({
      targets: this.flash,
      fillAlpha: 0,
      duration: BOMB.stunMs,
      ease: 'Sine.easeOut',
    });
    this.scene.cameras.main.shake(120, 0.004);
  }

  private ripple(x: number, y: number): void {
    const ring = this.scene.add.image(x, y, TEX.ring(this.player)).setScale(0.5);
    this.container.add(ring);
    this.scene.tweens.add({
      targets: ring,
      scale: 1.6,
      alpha: 0,
      duration: 320,
      ease: 'Sine.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  private popText(x: number, y: number, text: string): void {
    const t = this.scene.add
      .text(x, y, text, { fontFamily: FONTS.display, fontSize: '20px', color: CSS.ink })
      .setOrigin(0.5);
    this.container.add(t);
    this.scene.tweens.add({
      targets: t,
      y: y - 22,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeOut',
      onComplete: () => t.destroy(),
    });
  }
}
