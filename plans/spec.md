# Reflex Duel — Design Spec
*(working title — placeholder, swap freely; see backlog R8)*

> Non-technical design spec. Status: **building & deployed** (full duel loop playable and live on GitHub Pages; not yet played by a real 5-year-old).
> This file holds **current truth only** — decisions that were worked out, built, and reviewed.
> The work queue (including unbuilt ideas) is [`backlog.md`](backlog.md); origin and history live in [`notes.md`](notes.md).

## 1. Pitch
Two players sit facing each other across a phone held in portrait, one at the top edge and one at the bottom. The screen splits in half; targets pop into a 3×3 grid on each player's half. Tap your targets fast, finish the numbered multi-tap ones, and never tap a bomb. Most points when the 60-second clock runs out wins.

## 2. Players & setup
- **2 players**, simultaneous **versus** play on one phone (designed for a parent + the 5-year-old).
- **Device:** Pixel 6, laid flat in **portrait**, players **facing each other** — one at the top short edge, one at the bottom. Each player only taps inside their own half.
- **P1 (top) plays upside-down by design:** the whole top half — grid, HUD, countdown, score pops, results card — is rotated 180° so it reads right-side-up for the top player.
- Simultaneous multitouch confirmed fine on the device (`activePointers: 5`).
- **No reading required** — everything is shapes, motion, and a few small numbers.

## 3. The goal
Score more points than the other player before the timer ends. **Nobody dies** — the worst outcome is a lower number, kept gentle for a 5-year-old (the loser's card says "SO CLOSE!", never "you lose").

## 4. Field & layout (built)
- Logical field **360×740** (≈ Pixel 6 portrait), ported 1:1 from the canonical wireframe mock.
- **Divider band** across the middle (y=370). Each half, reading from the divider toward the player's edge: a slim **HUD row** (SCORE left, TIME right), then a **3×3 grid** of 100px cells (gap 8, corner radius 14).
- The top half is the bottom half's layout **rotated 180° about screen center (180,370)** — one set of geometry constants lays out both halves (each half is a Phaser container whose origin sits on the divider; P1's is rotated). This rotation *is* the design, not a cosmetic flourish.
- **Canonical layout mock:** [`mockups/style-wireframe.html`](mockups/style-wireframe.html) (v1). The playfield is defined once in the mock and rendered twice (the P1 copy is the same `<use>` rotated 180°), exactly mirroring how the game builds the two halves.
- **Style review gallery:** [`mockups/style-gallery.html`](mockups/style-gallery.html) compares six visual directions: Electric Arcade, Sticker Pop, Sport Court, Signal Lab, Crayon Sketch, and Saturday Pop. These are static review mocks only; the playable game still uses the wireframe tokens until a winner is selected and ported into [`../src/tokens.ts`](../src/tokens.ts).

## 5. Mirrored spawns (the core fairness call)
- **One spawn stream drives both halves** — the same item type, in the same cell, at the same instant, on both sides (a `SpawnDirector` with a seeded PRNG).
- A pure reflex comparison: no luck complaints, and the parent can glance at the kid's identical board to coach ("don't touch that one!").
- A cell is eligible only while it's free on **both** halves — a tapped-away item leaves its cell reserved until its twin resolves too, so the boards never desync.

## 6. Items & scoring (built)
- **Single-tap target** — tap before it vanishes: **+1**.
- **Double-tap target** — shows **2**, counts down per tap, **+2** when finished (no partial credit — finishing is the skill).
- **Triple-tap target** — shows **3**, **+3** when finished.
- **Bomb** — must be left alone. Tapping it costs **−3** and **stuns that half ~1s** (red flash + camera shake; taps ignored during the stun). Score never drops below 0.
- Missing a target (letting it expire) costs **nothing** — gentle at 5; only bombs punish.
- **Numbers everywhere a 5-year-old can read them:** taps-remaining on items, the countdown clock, both scores, the 3-2-1 start.

## 7. Pacing (built)
- Round is **60 seconds**.
- Spawn gap ramps **1.2s → 0.35s** across the round, **eased to back-load the acceleration** (`SPAWN.rampExp`): a calm opening (~1s gaps through the first 30s), turning frantic in the final ~15s (~0.5s at 54s, 0.35s at the buzzer — roughly 3.4× the opening rate). Tune via `startGapMs`/`endGapMs`/`rampExp` in `src/layout.ts`.
- Item lifetimes: single ~1.8s, double ~2.6s, triple ~3.2s, bomb ~2.2s.
- Items **blink as a warning** near expiry, so a vanishing target never feels like a cheat.
- The clock **pulses on both HUDs through the last 5 seconds**.
- **No handicap in v1** — symmetric rules for both seats. Fairness across the age gap is deferred to playtesting (backlog R1).

## 8. Feel / juice (built)
- Pop-in bounce on spawn (Back.easeOut scale); quick squash on each multi-tap.
- Ripple ring + floating "+1/+2/+3" on a score; floating "−3" on a bomb.
- Bomb tap: half-screen red flash + camera shake.
- Per-seat results card ("YOU WIN!" / "SO CLOSE!" / "TIE!"), readable from each seat.
- Sound is **not yet built** (backlog R4).

## 9. Round flow (built)
`ready` → `countdown` → `play` → `results`, a small phase machine in `DuelScene`:
1. Both players tap their half to ready up ("TAP WHEN READY" → "READY!").
2. Mirrored **3-2-1-GO!** countdown (pops per step).
3. 60-second **play** phase (spawns, taps, scoring, stuns).
4. **Results**: dim + per-seat card; tap to play again (a ~600ms lockout stops a frantic last tap from skipping it). Restart re-inits all state.

## 10. Tech (built)
Phaser 3 + TypeScript + Vite, ported from the Star Slingers prototype. All colors/fonts live in [`../src/tokens.ts`](../src/tokens.ts) (the theming API — restyling = swapping token values for a winning style variant). Geometry/tuning in [`../src/layout.ts`](../src/layout.ts). Procedural textures, nothing loaded from disk. Deployed to **GitHub Pages** via `.github/workflows/deploy-pages.yml` → https://michac.github.io/reflex-game/ .

## Everything else
Handicap/fairness levers, sound, more item types, match flow, style variants, full-screen/PWA: tracked as [`backlog.md`](backlog.md) items — wants to react to, not built decisions. They graduate into this spec when worked out, built, and reviewed.

## Open questions
Tracked in [`backlog.md`](backlog.md) — nothing floats in chat.
