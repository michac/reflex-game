# Reflex Duel — Backlog

> **The work queue.** Wants get recorded here before any work starts; nothing gets worked that isn't written down.
>
> **Flow:** Michael lists changes → they're recorded as items → worked one at a time (or batched into a workflow when several are big and independent) → finishing an item means: built/decided, [`spec.md`](spec.md) synced, history appended to [`notes.md`](notes.md), item moved to Resolved.
>
> **Statuses:** `idea` (recorded) · `decided` (design agreed, not built) · `building` · `done`.
> **[draft]** marks items carrying unreviewed material from the spec template / brainstorm — raw ideas to react to, not decisions.

## Next up

### R1 · 5-year-old fairness levers — `idea` ★ the big open design question
v1 is deliberately symmetric (spec §7). Once the kid actually plays, decide the handicap. Candidates captured during design (AskUserQuestion, 2026-06-07): **slower despawn on his side** (invisible — items linger only on the kid's half); **adjustable per-player level** (a pre-game 1–5 dial driving spawn rate / lifetime, so the handicap shrinks as he improves); **gentler bomb penalty for him** (bomb costs dad more, or stuns dad longer). Pick after a real playtest — symmetric tuning may be enough if the game's simple enough.

### R2 · Round length — `idea`
Is 60s right for a 5-year-old's attention span, or better at 45s? Tune by watching a real round. (`ROUND.durationMs` in `src/layout.ts`.)

### R3 · Stun readability — `idea`
The bomb stun is a ~1s red flash + shake right now. Does a 5-year-old read "your taps are frozen"? May need a big "WAIT!" icon during the stun. Decide on the phone.

## Later

### R4 · Sound & juice — `idea` [draft]
Draft material: tap *pop* on a score; chunky *thud* on a bomb; rising pitch through a multi-tap; a tick on the last 5 seconds; crowd cheer on the results card. Optional light music loop. Nothing built yet.

### R5 · More item types — `idea` [draft]
Draft material: **tap-and-hold** target; **golden target** (+5, very short lifetime); **letter/number targets** ("tap the 4!") for sneaky learning that fits the no-reading-required rule (he recognizes letters/numbers). Each needs a distinct, kid-legible look.

### R6 · Best-of-3 match flow — `idea`
Wrap rounds into a match: a match-score strip on the divider, "win 2 of 3", a match-winner card. Turns one 60s round into a sit-down session.

### R7 · Tie-breaker — `idea`
Today an exact tie just shows "TIE!". Decide: sudden-death single target, or leave it a tie (probably fine at 5).

### R8 · Working title — `idea`
"Reflex Duel" is a placeholder — swap freely.

### R10 · Full screen / PWA on the phone — `idea`
Mirror Star Slingers' B12: hide browser chrome on the Pixel (Fullscreen API on first touch + a PWA manifest with `display: standalone` so it can live on the home screen). Verify against the Pages deploy.

## Resolved

- **R12 · Port Saturday Pop cartoon style into the game — `done`** *(2026-06-25)*. Selected the Saturday Pop mock as the shipped skin and ported `plans/mockups/tokens-cartoon.css` into the playable Phaser build: sky field, dark ink linework, yellow/pink player targets, purple bombs, chunky filled procedural textures, cream/yellow stroked text, tokenized divider/results overlay, and refreshed Playwright visual baselines. Gameplay geometry, scoring, spawn timing, mirrored reservations, and input behavior unchanged.
- **R9 · Style mockups for review — `done`** *(2026-06-23)*. Added six static style variants under `plans/mockups/`, all using the canonical mirrored 360×740 scene: **Electric Arcade** (`style-neon.html` + `tokens-neon.css`), **Sticker Pop** (`style-sticker.html` + `tokens-sticker.css`), **Sport Court** (`style-court.html` + `tokens-court.css`), **Signal Lab** (`style-signal.html` + `tokens-signal.css`), **Crayon Sketch** (`style-crayon.html` + `tokens-crayon.css`), and **Saturday Pop** (`style-cartoon.html` + `tokens-cartoon.css`). Added `style-gallery.html` to compare them via Vite. These began as review mocks; Saturday Pop was later selected and ported in R12.
- **R11 · Steeper, back-loaded spawn ramp — `done`** *(2026-06-07)*. The spawn-rate ramp was a shallow linear 1.1s→0.55s. Made it more frantic at the end: `startGapMs` 1100→1200, `endGapMs` 550→350, and added `SPAWN.rampExp` (2.2) so the gap eases as `t**rampExp` — a calm opening that back-loads the acceleration into the final stretch (gaps ~1015ms at 30s, 526ms at 54s, 350ms at the buzzer; ~3.4× the opening rate). One curve constant in `src/layout.ts`; `rampExp: 1` restores linear. Item lifetimes unchanged.
- **R0 · Core duel prototype + Pages deploy — `done`** *(2026-06-07)*. Built the full loop in one pass, porting the Star Slingers tech model: Phaser 3 + TS + Vite, 360×740 logical units, the **rotated-top-half container trick** (extended from SS's HUD-only rotation to the *whole* half — grid, HUD, items, pops, results all rotate with one container), the **token theming API** (`src/tokens.ts`), and the **mock conventions** (`shared/mock.css|js`, `tokens-wireframe.css`, canonical `style-wireframe.html`). Design calls made via AskUserQuestion (2026-06-07): **timed 60s round** (over first-to-N / tug-of-war), **mirrored spawns** (over independent), **bomb = −3 + ~1s stun, missed targets free** (over points-only / misses-also-cost), **no handicap yet** (→ R1). Items: tap/multi2/multi3/bomb with pop-in, expiry blink, ripple/float juice, never-below-0 scoring. `SpawnDirector` drives both halves from one seeded stream; cells stay reserved until both twins resolve. Phase machine ready→countdown→play→results with a restart lockout. Verified headlessly (`smoke.mjs`): mirrored spawns confirmed, a tap scored 0→1, zero console errors. Deployed to a public repo **michac/reflex-game** with the SS GitHub Pages workflow (adapted from subdir to repo-root); build+deploy green, served bundle 200, live at https://michac.github.io/reflex-game/ . **Not yet played by the 5-year-old.**
