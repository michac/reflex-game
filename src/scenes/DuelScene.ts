/**
 * DuelScene — orchestrates the duel: ready-up, mirrored countdown, the
 * 60-second round, and the per-seat results card. All per-player behavior
 * lives in PlayerHalf; this scene only draws shared chrome, routes taps,
 * and runs the phase machine.
 */
import Phaser from 'phaser';
import {
  COUNTDOWN_STEP_MS,
  DIVIDER_BAND,
  DIVIDER_Y,
  GAME_HEIGHT,
  GAME_WIDTH,
  RESULTS_LOCKOUT_MS,
  ROUND,
} from '../layout';
import { COLORS, CSS, FONTS, STROKES } from '../tokens';
import { generateTextures } from '../objects/textures';
import { PlayerHalf, type Seat } from '../objects/PlayerHalf';
import { SpawnDirector } from '../objects/SpawnDirector';

type Phase = 'ready' | 'countdown' | 'play' | 'results';

export class DuelScene extends Phaser.Scene {
  private halves!: { top: PlayerHalf; bottom: PlayerHalf };
  private director!: SpawnDirector;
  private phase: Phase = 'ready';
  private remainingMs = ROUND.durationMs;
  private elapsedMs = 0; // scene clock, used for the results tap-lockout
  private resultsAtMs = 0;
  private ready = { top: false, bottom: false };
  private readyTexts!: { top: Phaser.GameObjects.Text; bottom: Phaser.GameObjects.Text };

  constructor() {
    super('Duel');
  }

  create(): void {
    // re-init state explicitly — create() runs again on scene.restart()
    this.phase = 'ready';
    this.remainingMs = ROUND.durationMs;
    this.elapsedMs = 0;
    this.ready = { top: false, bottom: false };

    generateTextures(this);
    this.drawDivider();
    this.halves = {
      top: new PlayerHalf(this, 'top'),
      bottom: new PlayerHalf(this, 'bottom'),
    };
    this.director = new SpawnDirector([this.halves.top, this.halves.bottom]);

    this.readyTexts = {
      top: this.addSeatText('top', 170, 'TAP WHEN READY', 22, CSS.p1),
      bottom: this.addSeatText('bottom', 170, 'TAP WHEN READY', 22, CSS.p2),
    };

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.onTap(pointer));
  }

  update(_time: number, delta: number): void {
    this.elapsedMs += delta;
    if (this.phase !== 'play') return;

    this.remainingMs -= delta;
    this.halves.top.update(delta);
    this.halves.bottom.update(delta);
    this.halves.top.hud.setTime(this.remainingMs);
    this.halves.bottom.hud.setTime(this.remainingMs);
    this.director.update(delta);

    if (this.remainingMs <= 0) this.endRound();
  }

  // ---- input ----

  private onTap(pointer: Phaser.Input.Pointer): void {
    const seat: Seat = pointer.y < DIVIDER_Y ? 'top' : 'bottom';
    switch (this.phase) {
      case 'ready':
        if (!this.ready[seat]) {
          this.ready[seat] = true;
          this.readyTexts[seat].setText('READY!');
          if (this.ready.top && this.ready.bottom) this.startCountdown();
        }
        break;
      case 'play':
        this.halves[seat].tapAt(pointer.x, pointer.y);
        break;
      case 'results':
        // brief lockout so the last frantic taps can't skip the card
        if (this.elapsedMs - this.resultsAtMs > RESULTS_LOCKOUT_MS) this.scene.restart();
        break;
      case 'countdown':
        break;
    }
  }

  // ---- phases ----

  private startCountdown(): void {
    this.phase = 'countdown';
    this.readyTexts.top.destroy();
    this.readyTexts.bottom.destroy();

    const steps = [
      ...Array.from({ length: ROUND.countdownFrom }, (_, i) => String(ROUND.countdownFrom - i)),
      'GO!',
    ];
    const texts = [
      this.addSeatText('top', 185, steps[0], 64, CSS.p1, true),
      this.addSeatText('bottom', 185, steps[0], 64, CSS.p2, true),
    ];
    const pop = (): void => {
      for (const t of texts) {
        t.setScale(1.5);
        this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.easeOut' });
      }
    };
    pop();

    let i = 0;
    this.time.addEvent({
      delay: COUNTDOWN_STEP_MS,
      repeat: steps.length - 2, // fires once per remaining step
      callback: () => {
        i += 1;
        for (const t of texts) t.setText(steps[i]);
        pop();
        if (i === steps.length - 1) {
          // "GO!" — play starts NOW; the banner fades out over the action
          this.phase = 'play';
          this.tweens.add({
            targets: texts,
            alpha: 0,
            delay: 400,
            duration: 300,
            onComplete: () => texts.forEach((t) => t.destroy()),
          });
        }
      },
    });
  }

  private endRound(): void {
    this.phase = 'results';
    this.resultsAtMs = this.elapsedMs;
    // dim everything, then build per-seat cards ABOVE the dim
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      COLORS.line,
      STROKES.overlay.resultDimAlpha
    );
    this.showResults('top', this.halves.top.score, this.halves.bottom.score);
    this.showResults('bottom', this.halves.bottom.score, this.halves.top.score);
  }

  /** One seat's result card, in a fresh rotated container so it sits above
   *  the dim and reads toward its player. */
  private showResults(seat: Seat, mine: number, theirs: number): void {
    const c = this.add.container(seat === 'top' ? GAME_WIDTH : 0, DIVIDER_Y);
    if (seat === 'top') c.setAngle(180);
    // "SO CLOSE!" instead of "you lose" — kept warm for the 5-year-old
    const verdict = mine > theirs ? 'YOU WIN!' : mine < theirs ? 'SO CLOSE!' : 'TIE!';
    const color = seat === 'top' ? CSS.p1 : CSS.p2;
    const text = (y: number, str: string, size: number, col: string, display = false) =>
      this.add
        .text(GAME_WIDTH / 2, y, str, {
          fontFamily: display ? FONTS.display : FONTS.body,
          fontSize: `${size}px`,
          color: col,
          fontStyle: 'bold',
          stroke: CSS.line,
          strokeThickness: display || size >= 24 ? STROKES.textStroke.heavy : STROKES.textStroke.thin,
        })
        .setOrigin(0.5);
    c.add([
      text(110, verdict, 34, color),
      text(165, `${mine} - ${theirs}`, 24, CSS.cream, true),
      text(215, 'tap to play again', 13, CSS.chromeMuted),
    ]);
  }

  // ---- chrome ----

  private addSeatText(
    seat: Seat,
    localY: number,
    str: string,
    size: number,
    color: string,
    display = false
  ): Phaser.GameObjects.Text {
    const t = this.add
      .text(GAME_WIDTH / 2, localY, str, {
        fontFamily: display ? FONTS.display : FONTS.body,
        fontSize: `${size}px`,
        color,
        fontStyle: 'bold',
        stroke: CSS.line,
        strokeThickness: display || size >= 22 ? STROKES.textStroke.heavy : STROKES.textStroke.thin,
      })
      .setOrigin(0.5);
    this.halves[seat].container.add(t);
    return t;
  }

  private drawDivider(): void {
    const g = this.add.graphics();
    const top = DIVIDER_Y - DIVIDER_BAND / 2;
    g.fillStyle(COLORS.dividerBand, STROKES.divider.bandAlpha);
    g.fillRect(0, top, GAME_WIDTH, DIVIDER_BAND);
    g.lineStyle(STROKES.divider.width, COLORS.cream, STROKES.divider.alpha);
    g.beginPath();
    g.moveTo(0, top);
    g.lineTo(GAME_WIDTH, top);
    g.moveTo(0, top + DIVIDER_BAND);
    g.lineTo(GAME_WIDTH, top + DIVIDER_BAND);
    g.strokePath();
  }
}
