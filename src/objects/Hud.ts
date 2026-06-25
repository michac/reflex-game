/**
 * Hud.ts — per-player TEAM + TIME row, sitting just below the divider in
 * half-local coordinates. The parent container's rotation makes P1's HUD
 * read upside-down on screen — right-side-up for the top player.
 */
import Phaser from 'phaser';
import { HUD_LOCAL, SPAWN } from '../layout';
import { CSS, FONTS, STROKES } from '../tokens';
import type { PlayerKey } from './textures';

const PULSE_AT_S = 5; // clock pulses through the last seconds

export class Hud {
  private readonly scene: Phaser.Scene;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly timeText: Phaser.GameObjects.Text;
  private readonly mistakesText: Phaser.GameObjects.Text;
  private readonly cpsText: Phaser.GameObjects.Text;
  private lastTime = '';
  private lastCps = '';
  private pulsing = false;

  constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container, player: PlayerKey) {
    this.scene = scene;
    const label = (x: number, text: string) =>
      scene.add
        .text(x, HUD_LOCAL.y, text, {
          fontFamily: FONTS.body,
          fontSize: '11px',
          color: CSS.ink,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setAlpha(0.76);
    const value = (x: number, text: string, color: string) =>
      scene.add
        .text(x, HUD_LOCAL.y, text, {
          fontFamily: FONTS.display,
          fontSize: '16px',
          color,
          stroke: CSS.line,
          strokeThickness: STROKES.textStroke.thin,
        })
        .setOrigin(0, 0.5);
    const statLabel = (x: number, text: string) =>
      scene.add
        .text(x, HUD_LOCAL.statY, text, {
          fontFamily: FONTS.body,
          fontSize: '9px',
          color: CSS.ink,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setAlpha(0.68);
    const statValue = (x: number, text: string) =>
      scene.add
        .text(x, HUD_LOCAL.statY, text, {
          fontFamily: FONTS.display,
          fontSize: '10px',
          color: CSS.cream,
          stroke: CSS.line,
          strokeThickness: STROKES.textStroke.thin,
        })
        .setOrigin(0, 0.5);

    this.scoreText = value(HUD_LOCAL.scoreValueX, '0', CSS[player]);
    this.timeText = value(HUD_LOCAL.timeValueX, '', CSS.accent);
    this.mistakesText = statValue(HUD_LOCAL.mistakeValueX, '0');
    this.cpsText = statValue(HUD_LOCAL.cpsValueX, SPAWN.startCps.toFixed(2));
    container.add([
      label(HUD_LOCAL.scoreLabelX, 'TEAM'),
      this.scoreText,
      label(HUD_LOCAL.timeLabelX, 'TIME'),
      this.timeText,
      statLabel(HUD_LOCAL.mistakeLabelX, 'ERR'),
      this.mistakesText,
      statLabel(HUD_LOCAL.cpsLabelX, 'CPS'),
      this.cpsText,
    ]);
  }

  setScore(score: number): void {
    this.scoreText.setText(String(score));
  }

  setMistakes(count: number): void {
    this.mistakesText.setText(String(count));
  }

  setCps(cps: number): void {
    const text = cps.toFixed(2);
    if (text === this.lastCps) return;
    this.lastCps = text;
    this.cpsText.setText(text);
  }

  setTime(msRemaining: number): void {
    const s = Math.max(0, Math.ceil(msRemaining / 1000));
    const text = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    if (text !== this.lastTime) {
      this.lastTime = text;
      this.timeText.setText(text);
    }
    if (s <= PULSE_AT_S && s > 0 && !this.pulsing) {
      this.pulsing = true;
      this.scene.tweens.add({
        targets: this.timeText,
        alpha: 0.35,
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }
}
