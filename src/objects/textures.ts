/**
 * textures.ts — one-time procedural texture generation.
 * All shapes are drawn from tokens.ts colors; nothing is loaded from disk.
 */
import Phaser from 'phaser';
import { GRID, ITEM } from '../layout';
import { COLORS, STROKES } from '../tokens';

export type PlayerKey = 'p1' | 'p2';

export const TEX = {
  cell: 'cell',
  bomb: 'bomb',
  target: (p: PlayerKey) => `target-${p}`,
  multi: (p: PlayerKey) => `multi-${p}`,
  ring: (p: PlayerKey) => `ring-${p}`,
} as const;

/** Ripple ring base size (scaled in the tween). */
const RING_R = 26;
const RING_D = RING_R * 2 + 4;

/** Bomb canvas is taller than the body: fuse + spark poke out the top. */
const BOMB_D = 88;
const BOMB_BODY_R = 28;

export function generateTextures(scene: Phaser.Scene): void {
  makeCell(scene);
  makeBomb(scene);
  for (const p of ['p1', 'p2'] as const) {
    makeTarget(scene, TEX.target(p), COLORS[p], false);
    makeTarget(scene, TEX.multi(p), COLORS[p], true);
    makeRing(scene, TEX.ring(p), COLORS[p]);
  }
}

function makeCell(scene: Phaser.Scene): void {
  // Textures live on the Game, not the scene — regenerating after a
  // scene.restart() would warn "key already in use".
  if (scene.textures.exists(TEX.cell)) return;
  const g = scene.make.graphics({}, false);
  const inset = STROKES.cell.width / 2; // keep the stroke inside the canvas
  g.lineStyle(STROKES.cell.width, COLORS.lineDim, 1);
  g.strokeRoundedRect(
    inset,
    inset,
    GRID.cell - STROKES.cell.width,
    GRID.cell - STROKES.cell.width,
    GRID.cornerRadius
  );
  g.generateTexture(TEX.cell, GRID.cell, GRID.cell);
  g.destroy();
}

/** Single-tap = circle + core dot; multi = circle + inner ring (the taps-left
 *  number is a Text the Item lays over the center). */
function makeTarget(scene: Phaser.Scene, key: string, color: number, multi: boolean): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  const c = ITEM.textureSize / 2;
  g.lineStyle(STROKES.target.width, color, 1);
  g.strokeCircle(c, c, ITEM.radius - STROKES.target.width / 2);
  if (multi) {
    g.lineStyle(STROKES.ring.width, color, STROKES.ring.alpha);
    g.strokeCircle(c, c, ITEM.ringRadius);
  } else {
    g.fillStyle(color, 1);
    g.fillCircle(c, c, ITEM.coreRadius);
  }
  g.generateTexture(key, ITEM.textureSize, ITEM.textureSize);
  g.destroy();
}

function makeRing(scene: Phaser.Scene, key: string, color: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  const c = RING_D / 2;
  g.lineStyle(STROKES.ripple.width, color, 1);
  g.strokeCircle(c, c, RING_R);
  g.generateTexture(key, RING_D, RING_D);
  g.destroy();
}

/** Bomb from the mock: body circle, X, fuse arcing out the top, spark dot. */
function makeBomb(scene: Phaser.Scene): void {
  if (scene.textures.exists(TEX.bomb)) return;
  const g = scene.make.graphics({}, false);
  const cx = BOMB_D / 2; // 44
  const cy = BOMB_D / 2 + 4; // body sits low so the fuse fits above
  g.lineStyle(STROKES.bombBody.width, COLORS.danger, 1);
  g.strokeCircle(cx, cy, BOMB_BODY_R);
  // the X (mock: ±11 around the body center)
  g.lineStyle(STROKES.bombX.width, COLORS.danger, 1);
  g.beginPath();
  g.moveTo(cx - 11, cy - 11);
  g.lineTo(cx + 11, cy + 11);
  g.moveTo(cx + 11, cy - 11);
  g.lineTo(cx - 11, cy + 11);
  g.strokePath();
  // fuse (two short segments approximate the mock's quadratic)
  g.lineStyle(STROKES.fuse.width, COLORS.lineDim, 1);
  g.beginPath();
  g.moveTo(cx, cy - BOMB_BODY_R);
  g.lineTo(cx + 6, cy - BOMB_BODY_R - 6);
  g.lineTo(cx + 13, cy - BOMB_BODY_R - 8);
  g.strokePath();
  // spark
  g.fillStyle(COLORS.ink, 1);
  g.fillCircle(cx + 15, cy - BOMB_BODY_R - 10, 3);
  g.generateTexture(TEX.bomb, BOMB_D, BOMB_D);
  g.destroy();
}
