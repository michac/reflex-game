/**
 * layout.ts — geometry + tuning constants, ported 1:1 from the canonical
 * v1 mock (plans/mockups/style-wireframe.html, viewBox 360x740).
 *
 * Half-local coordinate frame: each PlayerHalf container sits ON the
 * divider; local y grows toward that player's screen edge. P1's container
 * is rotated 180°, so ONE set of constants lays out both halves.
 */

export const GAME_WIDTH = 360;
export const GAME_HEIGHT = 740;
export const DIVIDER_Y = 370;
export const HALF_HEIGHT = GAME_HEIGHT - DIVIDER_Y; // 370
export const DIVIDER_BAND = 10; // mock: divider-band height

/** 3x3 grid per half. Mock: cells at x 18/126/234, screen y 410 = local 40. */
export const GRID = {
  cols: 3,
  rows: 3,
  cell: 100,
  gap: 8,
  originX: 18,
  originY: 40,
  cornerRadius: 14,
} as const;
export const CELL_COUNT = GRID.cols * GRID.rows; // 9

/** Center of a cell in half-local coordinates (index 0..8, row-major). */
export function cellCenter(index: number): { x: number; y: number } {
  const col = index % GRID.cols;
  const row = Math.floor(index / GRID.cols);
  const pitch = GRID.cell + GRID.gap;
  return {
    x: GRID.originX + col * pitch + GRID.cell / 2,
    y: GRID.originY + row * pitch + GRID.cell / 2,
  };
}

/** HUD row between the divider and the grid (mock baseline y≈400 = local 30). */
export const HUD_LOCAL = {
  y: 30,
  scoreLabelX: 18,
  scoreValueX: 64,
  timeLabelX: 272,
  timeValueX: 308,
} as const;

export type ItemType = 'tap' | 'multi2' | 'multi3' | 'bomb';

/** Item art geometry (mock: target r=32, core r=6, inner ring r=24). */
export const ITEM = {
  radius: 32,
  coreRadius: 6,
  ringRadius: 24,
  textureSize: 72, // 2*(radius + stroke) rounded up
  tapSlop: 14, // extra hit radius — generous for 5-year-old fingers
  popInMs: 140,
  despawnMs: 130,
  warnMs: 600, // expiry blink window, so a vanish never feels like a cheat
} as const;

/** Per-type rules. Multi-tap points = taps needed; no partial credit. */
export const ITEM_DEFS: Record<ItemType, { taps: number; points: number; lifeMs: number }> = {
  tap: { taps: 1, points: 1, lifeMs: 1800 },
  multi2: { taps: 2, points: 2, lifeMs: 2600 },
  multi3: { taps: 3, points: 3, lifeMs: 3200 },
  bomb: { taps: 0, points: 0, lifeMs: 2200 }, // penalty lives in BOMB
};

export const BOMB = { penalty: 3, stunMs: 1000 } as const;

export const ROUND = { durationMs: 60_000, countdownFrom: 3 } as const;

/**
 * Mirrored spawn pacing: one stream drives both halves. The gap between
 * spawns ramps linearly across the round.
 */
export const SPAWN = {
  startGapMs: 1200, // a calm opening...
  endGapMs: 350, // ...sprinting to ~3.4x the spawn rate by the end
  // Ramp curve: gap = lerp(start, end, t**rampExp), t = round progress 0->1.
  // rampExp 1 = linear; >1 back-loads the acceleration so it stays easy early
  // and turns frantic in the final stretch.
  rampExp: 2.2,
  retryGapMs: 150, // wait when no cell is free on BOTH halves
  weights: { tap: 0.62, multi2: 0.15, multi3: 0.08, bomb: 0.15 },
} as const;

/** Results card: ignore taps briefly so the loser's last tap can't skip it. */
export const RESULTS_LOCKOUT_MS = 600;

export const COUNTDOWN_STEP_MS = 800;
