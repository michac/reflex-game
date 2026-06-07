# Reflex Duel — Design Spec

> Non-technical design spec. Template and conventions ported from
> `claude-projects/game/plans/_spec-template.md`.
> Supersedes the "Reaction Duel" concept sketch in the game repo — the
> slap-your-half idea grew into a grid-tapping duel.
> Status: **building**

## 1. Pitch
The phone splits in two; targets pop up in a grid on each player's half and
whoever taps theirs fastest — while dodging bombs and finishing multi-tap
targets — wins the round.

## 2. Players & setup
- 2 players, simultaneous versus play on one phone (Pixel 6).
- **Portrait**, phone flat between the players, who face each other.
- P1 plays from the **top** edge, P2 from the **bottom**. The top half's
  entire UI is rotated 180° so it reads right-side-up for P1
  (same trick as Star Slingers' P1 HUD).
- Each player only taps inside their own half.

## 3. The goal
Score more points than the other player before the round timer runs out.
Nobody "dies" — the worst outcome is a lower number, kept gentle for a
5-year-old.

## 4. Gameplay loop
1. Both players tap their half to ready up; a mirrored 3-2-1 countdown plays.
2. For **60 seconds**, items pop into random grid cells on both halves —
   **the same items, in the same cells, at the same time on both sides**
   (mirrored sequence: pure reflex comparison, no luck complaints).
3. Tap a target before it vanishes to score. Multi-tap targets show a
   number counting down the taps they still need. Bombs must be left alone.
4. Spawning speeds up gradually through the round.
5. Timer hits zero → results card: scores, winner, tap to play again.

## 5. Controls & UI shape
- One control: tap. Generous hit slop around each item for small fingers.
- Screen (360×740 logical units, the mock viewBox):
  - **Divider band** across the vertical middle.
  - Each half, reading from the divider toward the player's edge:
    a slim **HUD row** (score left, time right), then a **3×3 grid** of
    ~100px cells filling the rest of the half.
  - The top half is an exact 180°-rotated copy of the bottom half layout.
- Items pop in with a scale tween, blink as a warning near expiry, shrink
  away when they time out.

## 6. Player dynamic
Pure versus, but the mirrored sequence means both players always face the
identical board — dad can glance across to coach ("don't touch that one!").
Fairness across the age gap comes from tuning, not asymmetry (yet — see
open questions).

## 7. Difficulty & pacing
- Spawn gap ramps from ~1.1s down to ~0.55s across the round.
- Item lifetimes: single-tap ~1.8s, double ~2.6s, triple ~3.2s, bomb ~2.2s.
- Mistakes are cheap: a missed target just vanishes (no penalty); only
  bomb taps cost points + a ~1s stun on your half (screen flash, taps
  ignored). Score never goes below 0.
- **No handicap in v1** — symmetric rules; fairness levers get tuned in
  playtesting (see open questions).

## 8. Numbers & scoring
- Single-tap target: **+1**.
- Double-tap target: shows **2**, counts down per tap, **+2** when finished
  (no partial credit — finishing is the skill).
- Triple-tap target: shows **3**, **+3** when finished.
- Bomb tap: **−3** and ~1s stun.
- Numbers everywhere a 5-year-old can read them: taps-remaining on items,
  the countdown clock, both scores, the 3-2-1 start.

## 9. Feel / juice
- Pop-in bounce on spawn; ripple ring + floating "+1/+2/+3" on a score.
- Bomb tap: screen-flash on that half, shake, floating "−3".
- Expiry warning blink so a vanishing target never feels like a cheat.
- Last 5 seconds: clock pulses on both HUDs.
- Results card readable from both seats (per-seat rotated text).
- Sound later (stretch) — tap pops, bomb thud, crowd-cheer at results.

## 10. Stretch ideas
- Sound effects + a simple music loop.
- Handicap levers: per-player level dial (spawn rate / lifetime), gentler
  bomb penalty for the kid.
- More item types: "tap-and-hold", "golden target" (+5, tiny lifetime),
  letter/number targets ("tap the 4!") for sneaky learning.
- Best-of-3 match flow with a match-score strip on the divider.
- Style variants (neon, vector, …) via token swap, same as Star Slingers.

## Open questions
- Handicap defaults once playtested — slower despawn for the kid?
  Adjustable per-player level? (Deliberately deferred from v1.)
- Round length: is 60s right for a 5-year-old's attention span, or better
  at 45s?
- Does the stun need to be more visible (big "WAIT!" icon) to read at 5?
- Tie-breaker: sudden-death single target, or just call it a tie?
