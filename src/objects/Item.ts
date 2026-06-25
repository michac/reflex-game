/**
 * Item.ts — one grid item (tap target / multi-tap target / bomb): pop-in,
 * expiry blink, tap resolution, despawn tweens. Lives inside a PlayerHalf
 * container, whose rotation makes everything read toward its player.
 */
import Phaser from 'phaser';
import { ITEM, ITEM_DEFS, type ItemType } from '../layout';
import { CSS, FONTS } from '../tokens';
import { TEX, type PlayerKey } from './textures';

export type TapResult =
  | { kind: 'bomb' }
  | { kind: 'progress'; tapsLeft: number }
  | { kind: 'complete'; points: number };
export type GoneReason = 'scored' | 'expired' | 'explode';

export class Item extends Phaser.GameObjects.Container {
  readonly cellIndex: number;
  readonly itemType: ItemType;
  private tapsLeft: number;
  private readonly lifeMs: number;
  private ageMs = 0;
  private dying = false;
  private readonly countText?: Phaser.GameObjects.Text;
  private readonly onGone: (item: Item, reason: GoneReason) => void;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    itemType: ItemType,
    cellIndex: number,
    player: PlayerKey,
    onGone: (item: Item, reason: GoneReason) => void,
    lifeScale = 1
  ) {
    super(scene, x, y);
    this.itemType = itemType;
    this.cellIndex = cellIndex;
    this.onGone = onGone;
    const def = ITEM_DEFS[itemType];
    this.tapsLeft = def.taps;
    this.lifeMs = itemType === 'bomb' ? def.lifeMs : def.lifeMs * lifeScale;

    const texKey =
      itemType === 'bomb' ? TEX.bomb : def.taps > 1 ? TEX.multi(player) : TEX.target(player);
    this.add(scene.add.image(0, 0, texKey));
    if (def.taps > 1) {
      this.countText = scene.add
        .text(0, 1, String(def.taps), {
          fontFamily: FONTS.display,
          fontSize: '26px',
          color: CSS.ink,
        })
        .setOrigin(0.5);
      this.add(this.countText);
    }

    this.setScale(0);
    scene.tweens.add({ targets: this, scale: 1, duration: ITEM.popInMs, ease: 'Back.easeOut' });
  }

  /** False once a despawn/score/explode tween has started. */
  get isLive(): boolean {
    return !this.dying;
  }

  /** True when (lx,ly) — local to the half — lands on this item. */
  hits(lx: number, ly: number): boolean {
    if (this.dying) return false;
    return (
      Phaser.Math.Distance.Between(lx, ly, this.x, this.y) <= ITEM.radius + ITEM.tapSlop
    );
  }

  tap(): TapResult {
    if (this.itemType === 'bomb') {
      this.vanish('explode');
      return { kind: 'bomb' };
    }
    this.tapsLeft -= 1;
    if (this.tapsLeft <= 0) {
      const points = ITEM_DEFS[this.itemType].points;
      this.vanish('scored');
      return { kind: 'complete', points };
    }
    this.countText?.setText(String(this.tapsLeft));
    // quick squash so every tap visibly lands even mid-multi
    this.scene.tweens.add({ targets: this, scale: 0.85, duration: 60, yoyo: true });
    return { kind: 'progress', tapsLeft: this.tapsLeft };
  }

  /** Per-frame aging (driven by PlayerHalf, only while the round runs). */
  step(delta: number): void {
    if (this.dying) return;
    this.ageMs += delta;
    const remaining = this.lifeMs - this.ageMs;
    if (remaining <= 0) {
      this.vanish('expired');
    } else if (remaining < ITEM.warnMs) {
      // expiry blink, so a vanishing target never feels like a cheat
      this.alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.ageMs / 45));
    }
  }

  private vanish(how: GoneReason): void {
    if (this.dying) return;
    this.dying = true; // stops hit tests; PlayerHalf keeps the cell reserved until onGone
    const cfg =
      how === 'scored'
        ? { scale: 1.3, alpha: 0, duration: ITEM.despawnMs }
        : how === 'explode'
          ? { scale: 1.6, alpha: 0, duration: ITEM.despawnMs * 1.6 }
          : { scale: 0, alpha: 0.2, duration: ITEM.despawnMs };
    this.scene.tweens.add({
      targets: this,
      ...cfg,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.onGone(this, how);
        this.destroy();
      },
    });
  }
}
