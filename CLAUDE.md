# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Reflex Duel — a two-player reflex game for **one phone held in portrait** (Pixel 6, 360×740 logical px). The screen splits at a divider band (y=370); each player owns a half. Targets spawn mirrored on both halves; tap fast, finish multi-tap targets, never tap bombs. Most points in 60s wins. Built with Phaser 3 + TypeScript + Vite. No physics plugin — everything is containers, tweens, and distance checks.

## Commands

- `npm run dev` — dev server at http://localhost:5173 (LAN-exposed via `host: true`)
- `npm run build` — typecheck then production bundle (`tsc --noEmit && vite build`)
- `npm run typecheck` — `tsc --noEmit` only; run this to verify edits
- `npm test` — Playwright Test assertion suite (boots the game headless via an auto-started dev server, drives it with coordinate taps, asserts scoring/mirroring/phases/zero-console-errors, and visual-diffs the ready/countdown/results screens). `npm run test:update` refreshes baselines after intentional UI changes.

Tests live in `e2e/` and read live game state through the `window.__game` hook (`src/main.ts:24`). First run on a machine needs `npx playwright install chromium`. Visual baselines are OS-specific (committed from Windows under `e2e/duel.spec.ts-snapshots/`); regenerate with `npm run test:update` if running on another OS.

No linter or formatter is configured. Match the existing style by hand (see below). Node 24 (per CI).

## Architecture

- **Rotated-container trick** — each half is one Phaser `Container` with its origin on the divider. The top half's container is rotated 180°, so a *single* set of geometry constants lays out both seats with zero per-seat code. Screen→local for taps: `lx = seat === 'top' ? GAME_WIDTH - screenX : screenX`. Don't assume world space == screen space.
- **`DuelScene`** orchestrates the phase machine (ready → countdown → play → results) and routes taps. **`PlayerHalf`** owns a half's 3×3 grid, `Hud`, and `Item`s. **`SpawnDirector`** is one seeded PRNG feeding both halves the same item/cell/instant.
- **Cell reservation** — a cell stays reserved on *both* halves until both item twins despawn (`SpawnDirector.pickFreeCell()` intersects both halves' free cells). Releasing a cell early (e.g. during a fade tween) causes desync — twins can spawn into the same cell on opposite sides. Don't change release timing without accounting for this.
- **Procedural textures** — `generateTextures()` draws everything from token colors; nothing is loaded from disk. Textures are cached on the Game object, so `scene.restart()` paths must guard with `scene.textures.exists()` before regenerating.

## Design constants — single source of truth

- **`src/tokens.ts`** — the *only* home for colors (hex numbers for Graphics/tints, CSS strings for Text), fonts, and stroke recipes. Never hard-code a color or font; read it from here. Ported 1:1 from `plans/mockups/tokens-wireframe.css`.
- **`src/layout.ts`** — all geometry (grid, cell centers, HUD positions), item definitions (taps/points/lifetimes), and spawn/tuning constants. Geometry is half-local (origin on divider, grows toward the player's edge).

Restyling is a swap-and-rebuild: edit token values in the mockups, then port them into `src/tokens.ts`. It is not a runtime theme system.

## Code style

- 2-space indent, single quotes, semicolons always, trailing commas in multiline literals.
- `type` over `interface`. `as const` for readonly token/constant objects; `Record<ItemType, ...>` for type-keyed maps.
- PascalCase classes, camelCase members, ALL_CAPS for readonly exports (`COLORS`, `GAME_WIDTH`).
- Strict mode is on; unused vars/params are errors.

## Docs model (`plans/`)

- **`plans/spec.md`** — current built truth (what's designed, built, reviewed).
- **`plans/backlog.md`** — work queue (items tagged idea / decided / building / done).
- **`plans/notes.md`** — history and design reasoning.
- **`plans/mockups/`** — `style-wireframe.html` is the canonical layout skeleton (one SVG `<symbol>` rendered twice, once rotated — mirrors how the game builds the two halves); `tokens-wireframe.css` is the theming API.

Keep `plans/spec.md` and `plans/backlog.md` current when shipping or changing features.
