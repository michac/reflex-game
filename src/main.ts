import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './layout';
import { COLORS } from './tokens';
import { DuelScene } from './scenes/DuelScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.sceneBg,
  scale: {
    // 360x740 logical units == the mock's viewBox, scaled to fit the screen.
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // Two players × two thumbs + one spare; Phaser's default is 2 total,
  // which would drop simultaneous touches.
  input: { activePointers: 5 },
  scene: [DuelScene],
});

// Debug handle for headless smoke tests and console poking.
(window as unknown as { __game: Phaser.Game }).__game = game;
