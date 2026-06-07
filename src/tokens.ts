/**
 * tokens.ts — the game's THEMING API, ported 1:1 from
 * plans/mockups/tokens-wireframe.css.
 *
 * Every color and font in the game comes from here and nowhere else.
 * Restyling (neon, vector, ...) = swapping these values for the winning
 * style variant's token file. Geometry lives in layout.ts, not here.
 */

/** Hex numbers for Graphics / tints / backgroundColor. */
export const COLORS = {
  sceneBg: 0x101015, // --scene-bg
  line: 0x9aa0ae, // --line: universal wireframe stroke
  lineDim: 0x4c505c, // --line-dim: grid cells, divider band, fuses
  p1: 0xe8ecf4, // --p1: TOP player
  p2: 0xb0b6c4, // --p2: BOTTOM player
  danger: 0xc7ccd8, // --danger: bombs, stun flash
  ink: 0xf0f2f7, // --ink: tap counts, score pops
  chromeMuted: 0x8a8f9b, // --chrome-muted: HUD labels
} as const;

/** Same palette as CSS strings — Phaser Text styles want strings. */
export const CSS = {
  p1: '#e8ecf4',
  p2: '#b0b6c4',
  ink: '#f0f2f7',
  chromeMuted: '#8a8f9b',
  accent: '#d6d9e0', // --accent: the round clock
} as const;

export const FONTS = {
  display: '"Courier New", monospace', // --font-display: numbers, counters
  body: 'system-ui, sans-serif', // --font-body: labels
} as const;

/** Stroke recipes from the wireframe paint rules. */
export const STROKES = {
  cell: { width: 1.5 }, // .cell
  target: { width: 2.5 }, // .target
  ring: { width: 1.5, alpha: 0.6 }, // .target-ring
  bombBody: { width: 2.5 }, // .bomb-body
  bombX: { width: 3 }, // .bomb-x
  fuse: { width: 2 }, // .bomb-fuse
  ripple: { width: 2 }, // .ripple
  divider: { width: 1.5, alpha: 0.7, bandAlpha: 0.25 }, // .divider-*
} as const;
