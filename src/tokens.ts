/**
 * tokens.ts — the game's THEMING API, ported from
 * plans/mockups/tokens-cartoon.css.
 *
 * Every color and font in the game comes from here and nowhere else.
 * Restyling (neon, vector, ...) = swapping these values for the winning
 * style variant's token file. Geometry lives in layout.ts, not here.
 */

/** Hex numbers for Graphics / tints / backgroundColor. */
export const COLORS = {
  sceneBg: 0x7ad8ff, // --scene-bg
  line: 0x172033, // --line: cartoon ink stroke
  lineDim: 0x4aaed2, // --line-dim: secondary blue chrome
  p1: 0xfff05a, // --p1: TOP player
  p2: 0xff5fa2, // --p2: BOTTOM player
  danger: 0x7b43ff, // --danger: bombs, stun flash
  ink: 0x172033, // --ink: tap counts, linework
  cream: 0xfff7e8, // --chrome-ink / cream fills
  chromeMuted: 0xc9c1d8, // --chrome-muted
  accent: 0xffe066, // --accent: clock + spark
  cellFill: 0xffffff, // .cell fill
  shadow: 0x172033, // drop-shadow color
  dividerBand: 0x172033, // .divider-band
} as const;

/** Same palette as CSS strings — Phaser Text styles want strings. */
export const CSS = {
  p1: '#fff05a',
  p2: '#ff5fa2',
  ink: '#172033',
  cream: '#fff7e8',
  chromeMuted: '#c9c1d8',
  accent: '#ffe066', // --accent: the round clock
  line: '#172033',
} as const;

export const FONTS = {
  display: '"Arial Black", "Trebuchet MS", system-ui, sans-serif',
  body: '"Trebuchet MS", system-ui, sans-serif',
} as const;

/** Paint recipes from the Saturday Pop mock rules. */
export const STROKES = {
  cell: { width: 3.5, fillAlpha: 0.42, shadowY: 5, shadowAlpha: 0.22 }, // .cell
  target: { width: 5.5, shadowY: 6, shadowAlpha: 0.24 }, // .target
  ring: { width: 3.5, alpha: 0.78 }, // .target-ring
  bombBody: { width: 5.5, shadowY: 6, shadowAlpha: 0.24 }, // .bomb-body
  bombX: { width: 5.5 }, // .bomb-x
  fuse: { width: 4 }, // .bomb-fuse
  ripple: { width: 4 }, // .ripple
  divider: { width: 2.5, alpha: 0.9, bandAlpha: 1 }, // .divider-*
  textStroke: { thin: 2, heavy: 4 },
  overlay: { resultDimAlpha: 0.52 },
} as const;
