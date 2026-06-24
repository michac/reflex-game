# Reflex Duel — History & Playtests

> Status: **core duel built & deployed to Pages (R0, 2026-06-07); next: get it in front of the 5-year-old, then R1 fairness levers**
> Doc roles: [`spec.md`](spec.md) = current reviewed truth · [`backlog.md`](backlog.md) = work queue · **this file = history** (origin, builds, playtests, how we got here).

## Origin (brainstorm, 2026-06-04)

Came out of the family-game brainstorm in the sibling [`game`](../../game/) repo. The shortlist's top 3 were slingshot, draw-a-line hockey, and **reaction duel** — "dead simple, naturally drills the letters/numbers he's learning," the lowest-effort / high-5yo-fit pick. The original sketch ([`game/plans/reaction-duel/spec.md`](../../game/plans/reaction-duel/spec.md)) was "screen flashes a target, first to slap their half scores." This project **grew that slap-your-half idea into a grid-tapping duel** with multi-tap targets and bombs — more depth, same shared-screen reflex core.

Star Slingers was the first of the three to get fully built; Reflex Duel deliberately reuses its proven model (see below).

## R0 built — core duel + deploy (2026-06-07)

Built the whole thing in one pass. What was **stolen from Star Slingers** (Michael's explicit ask):
1. **Two-player portrait setup** — phone flat between players facing each other, 360×740 logical units.
2. **Rotated/repeated UI for the top player** — SS rotates just P1's HUD; here the trick is taken further: each half is a single Phaser container with its origin on the divider, and P1's whole container is rotated 180°, so grid + HUD + items + score pops + results all read toward the top player with **zero per-seat layout code**.
3. **Tech stack** — Phaser 3 + TS + Vite, same tsconfig/vite/index.html shape, `Scale.FIT`, procedural textures, `tokens.ts` as the only home for color/font, the headless `smoke.mjs` harness.
4. **Wireframe + style-mock conventions** — `plans/mockups/` with `shared/mock.css`+`mock.js`, `tokens-wireframe.css` as the theming API, and `style-wireframe.html` as the canonical layout skeleton (playfield defined once, rendered twice via a rotated `<use>` — mirroring how the game builds the halves).

**Design decisions (via AskUserQuestion, 2026-06-07), with the reasoning:**
- **Timed 60s round** over first-to-N or a tug-of-war meter — predictable length, the clock is a natural readable number, and a score race builds tension without a struggling player prolonging the game.
- **Mirrored spawns** over independent random — pure reflex comparison (no "you got easier ones!"), and the parent can read the kid's identical board to coach. Implemented as one seeded `SpawnDirector` stream feeding both halves; a cell stays reserved until **both** twins resolve so the boards can't desync.
- **Bomb = −3 + ~1s stun; missed targets cost nothing** over points-only or misses-also-cost — gives bombs real weight (a go/no-go decision, great at 5) while keeping the floor gentle: you can't lose by being slow, only by being reckless. Score clamps at 0.
- **No handicap yet** — keep v1 symmetric and tune fairness after a real playtest (→ backlog R1).

**Verification (headless, `smoke.mjs` adapted from SS):** boot → ready up both seats → countdown → play. Asserted **mirrored spawns** (top and bottom item cell/type sets identical — confirmed), landed a tap on a real target (**bottom score 0→1**), **zero console errors**. Screenshots `smoke-*.png` (gitignored). `npm run build` (tsc + vite) clean.

**Deploy:** copied SS's GitHub Pages mechanism — `.github/workflows/deploy-pages.yml`, simplified from SS's subdirectory setup to repo-root (no `working-directory`, no path scoping; reflex-game is its own repo, not a monorepo subfolder). Created public repo **michac/reflex-game** via `gh`, enabled Pages with the Actions build type, pushed. Build + deploy jobs both green; the served JS bundle resolves 200 (Vite's relative `base: './'` already handles the `/reflex-game/` project subpath, so no base change needed). **Live: https://michac.github.io/reflex-game/** — now reachable from any phone browser, no LAN/firewall step.

## R11 — steeper spawn ramp (2026-06-07)

First post-build tune. The linear 1.1s→0.55s spawn ramp felt too flat. Reworked to a **back-loaded** curve: `endGapMs` dropped to 350ms (≈3.4× the opening rate) and a new `SPAWN.rampExp` (2.2) eases the gap as `t**rampExp`, so the first half stays calm (~1s gaps through 30s) and the acceleration lands in the final ~15s — the "frantic finish" Michael asked for. Kept it one tunable constant (`rampExp: 1` = the old linear behavior) rather than hard-coding the curve. Verified the gap-vs-time table at the console (0/15/30/45/54/60s → 1200/1160/1015/749/526/350ms), `npm run build` clean, redeployed.

## R9 — style review mockups (2026-06-23)

Added a Vite-served style gallery at `plans/mockups/style-gallery.html` plus six visual directions using the canonical mirrored scene: Electric Arcade, Sticker Pop, Sport Court, Signal Lab, Crayon Sketch, and Saturday Pop. The variants share a small renderer (`shared/duel-mock.js`) so the geometry stays identical while each `tokens-*.css` explores a different paint system. This did **not** change the playable Phaser game; the chosen direction still needs to be ported into `src/tokens.ts` before it ships.

## Doc model adopted (2026-06-07)

Initially wrote a single design-template `spec.md`. Restructured to Star Slingers' three-doc model at Michael's prompt: `spec.md` slimmed to **current built truth**, this `notes.md` created for history, `backlog.md` created as the work queue (items R1–R10 + the resolved R0). Same standing flow as SS: record wants in the backlog first, work one at a time, sync the spec + append history as part of finishing.

## Playtests

None yet — the 5-year-old hasn't played. **The next real signal is a phone playtest** (it's deployed, so just open the URL on the Pixel). Watch for: can he tell which half is his / does the upside-down top read naturally for the top player; are multi-tap "2"/"3" targets understood; does the bomb stun read as "frozen"; is 60s the right length; how lopsided is dad-vs-kid (drives R1). 
