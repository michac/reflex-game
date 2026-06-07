# Reflex Duel

Two-player split-screen reflex duel for one phone (Pixel 6, portrait, phone
flat between the players). Targets pop into a 3×3 grid on each half —
**the same items, in the same cells, at the same instant on both sides**
(mirrored spawns). Tap targets fast, finish numbered multi-tap targets,
never tap a bomb (−3 and a 1-second stun). Most points after 60 seconds
wins.

Tech stack, layout conventions, and the rotated-top-half trick are ported
from the Star Slingers prototype (`../game/star-slingers`): Phaser 3 +
TypeScript + Vite, 360×740 logical units matching the mock viewBox, all
colors/fonts in `src/tokens.ts` (swapped for the winning style variant
later). Design docs live in `plans/` (spec + wireframe mock).

## Run

```sh
npm install
npm run dev        # serves on http://localhost:5173 (and your LAN IP)
```

Desktop check: click both halves to ready up, 3-2-1, then click targets.
The top half is upside-down on purpose — it faces the top player.

## Phone testing (Pixel 6)

1. `npm run dev` — Vite prints a `Network:` URL like `http://192.168.x.x:5173`.
2. Open that URL in Chrome on the phone (same Wi-Fi).
3. First run: Windows may prompt to allow Node through the firewall — allow
   it on **Private** networks. If the phone still can't connect, add an
   inbound allow rule for TCP 5173.
4. Lay the phone flat between you: P1 plays from the top edge, P2 from the
   bottom. Both halves must take taps at the same time with no page
   scroll, zoom, or missed touches.

## Scripts

- `npm run dev` — dev server (LAN-exposed)
- `npm run build` — typecheck + production bundle
- `npm run typecheck` — `tsc --noEmit` only

## Design docs

- `plans/spec.md` — the non-technical design spec (gameplay loop, scoring,
  open questions)
- `plans/mockups/style-wireframe.html` — canonical layout skeleton; style
  variants copy it and swap the tokens `<link>` (see the Star Slingers
  mock conventions)
