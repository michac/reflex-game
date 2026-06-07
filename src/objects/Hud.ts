/**
 * Hud.ts — per-player SCORE + TIME row, sitting just below the divider in
 * half-local coordinates. The parent container's rotation makes P1's HUD
 * read upside-down on screen — right-side-up for the top player.
 */
import Phaser from 'phaser';
import { HUD_LOCAL } from '../layout';
import { CSS, FONTS } from '../tokens';
import type { PlayerKey } from './textures';

const PULSE_AT_S = 5; // clock pulses through the last seconds

export class Hud {
  private readonly scene: Phaser.Scene;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly timeText: Phaser.GameObjects.Text;
  private lastTime = '';
  private pulsing = false;

  constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container, player: PlayerKey) {
    this.scene = scene;
    const label = (x: number, text: string) =>
      scene.add
        .text(x, HUD_LOCAL.y, text, {
          fontFamily: FONTS.body,
          fontSize: '11px',
          color: CSS.chromeMuted,
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);
    const value = (x: number, text: string, color: string) =>
      scene.add
        .text(x, HUD_LOCAL.y, text, {
          fontFamily: FONTS.display,
          fontSize: '16px',
          color,
        })
        .setOrigin(0, 0.5);

    this.scoreText = value(HUD_LOCAL.scoreValueX, '0', CSS[player]);
    this.timeText = value(HUD_LOCAL.timeValueX, '', CSS.accent);
    container.add([
      label(HUD_LOCAL.scoreLabelX, 'SCORE'),
      this.scoreText,
      label(HUD_LOCAL.timeLabelX, 'TIME'),
      this.timeText,
    ]);
  }

  setScore(score: number): void {
    this.scoreText.setText(String(score));
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
