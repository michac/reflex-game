/**
 * duel.spec.ts — Playwright Test port of the old smoke.mjs. Boots the game in
 * a Pixel-6-sized touch viewport, drives it with coordinate taps, and reads
 * live state through the `window.__game` hook (src/main.ts:24) to assert the
 * rules in CLAUDE.md: spawning, scoring, miss-is-free, adaptive pacing, the
 * phase machine, and zero console errors. The three deterministic screens also get visual
 * baselines (committed under duel.spec.ts-snapshots/).
 *
 * Reusable as a template for other Phaser/canvas projects: the state hook +
 * coordinate taps + toHaveScreenshot pattern is engine-agnostic.
 */
import { test, expect, type Page } from '@playwright/test';

const DIVIDER_Y = 370; // screen y of the divider; bottom-half local y + this = screen y
const ROUND_MS = 60_000; // ROUND.durationMs — reaching `results` waits out the full round
const READY_TOP = { x: 180, y: 200 }; // any point in the top half readies that seat
const READY_BOTTOM = { x: 180, y: 540 };

type Half = 'top' | 'bottom';
type LiveItem = { x: number; y: number; cell: number; type: string; lifeMs: number };
type Difficulty = {
  targetCps: number;
  cpsVelocity: number;
  spawnGapMs: number;
  lifeScale: number;
};
type State = {
  phase: string;
  top: LiveItem[];
  bottom: LiveItem[];
  scoreTeam: number;
  hudScoreTop: string;
  hudScoreBottom: string;
  mistakesTop: number;
  mistakesBottom: number;
  difficulty: Record<Half, Difficulty>;
};

// Console/page errors collected per test (listeners attached in gotoGame).
let errors: string[];

async function gotoGame(page: Page): Promise<void> {
  errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/');
  await page.waitForSelector('#game canvas', { timeout: 15_000 });
  await page.waitForTimeout(600); // let a few frames render
}

/** Tap a screen coordinate. The canvas FIT-fills the viewport, so we map
 *  game coords (360×740) onto the canvas box to stay robust to any centering. */
async function tap(page: Page, x: number, y: number): Promise<void> {
  const box = await page.locator('#game canvas').boundingBox();
  if (!box) throw new Error('game canvas has no bounding box');
  const sx = box.width / 360;
  const sy = box.height / 740;
  await page.mouse.click(box.x + x * sx, box.y + y * sy);
}

/** Item local coords map through the owning half's rotated container. */
async function tapItem(page: Page, item: LiveItem, half: Half = 'bottom'): Promise<void> {
  if (half === 'top') {
    await tap(page, 360 - item.x, DIVIDER_Y - item.y);
  } else {
    await tap(page, item.x, item.y + DIVIDER_Y);
  }
}

async function readState(page: Page): Promise<State> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).__game.scene.keys['Duel'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dump = (half: any): LiveItem[] =>
      [...half.items]
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((i: any) => i.isLive)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((i: any) => ({
          x: i.x,
          y: i.y,
          cell: i.cellIndex,
          type: i.itemType,
          lifeMs: i.lifeMs,
        }));
    return {
      phase: scene.phase,
      top: dump(scene.halves.top),
      bottom: dump(scene.halves.bottom),
      scoreTeam: scene.teamScore,
      hudScoreTop: scene.halves.top.hud.scoreText.text,
      hudScoreBottom: scene.halves.bottom.hud.scoreText.text,
      mistakesTop: scene.halves.top.mistakes,
      mistakesBottom: scene.halves.bottom.mistakes,
      difficulty: scene.director.debugState(),
    };
  });
}

/** Poll readState until `pick` returns a truthy value; fail on timeout.
 *  Handles random spawns deterministically without an RNG seed. */
async function waitForState<T>(
  page: Page,
  pick: (s: State) => T | null | undefined | false,
  label: string,
  timeout = 20_000
): Promise<T> {
  const start = Date.now();
  let last: State | undefined;
  while (Date.now() - start < timeout) {
    last = await readState(page);
    const v = pick(last);
    if (v) return v;
    await page.waitForTimeout(80);
  }
  throw new Error(`timed out after ${timeout}ms waiting for: ${label} (last phase=${last?.phase})`);
}

/** Wait for a live target of `type` (any non-despawning item if omitted) on a half. */
async function waitForLiveItem(
  page: Page,
  half: Half,
  type?: string,
  timeout = 20_000
): Promise<LiveItem> {
  return waitForState(
    page,
    (s) => s[half].find((i) => !type || i.type === type),
    `live ${type ?? 'item'} on ${half}`,
    timeout
  );
}

/** Ready both seats and wait for the countdown to hand off to play. */
async function startRound(page: Page): Promise<void> {
  await tap(page, READY_TOP.x, READY_TOP.y);
  await tap(page, READY_BOTTOM.x, READY_BOTTOM.y);
  await waitForState(page, (s) => s.phase === 'play', 'play phase', 8_000);
}

test.beforeEach(async ({ page }) => {
  await gotoGame(page);
});

test('boots clean — reaches play with no console errors', async ({ page }) => {
  await startRound(page);
  expect(errors).toEqual([]);
});

test('independent spawn lanes populate both halves without cell collisions', async ({ page }) => {
  await startRound(page);
  const s = await waitForState(
    page,
    (st) => (st.top.length > 0 && st.bottom.length > 0 ? st : null),
    'spawned items on both halves'
  );
  for (const items of [s.top, s.bottom]) {
    expect(new Set(items.map((i) => i.cell)).size).toBe(items.length);
  }
});

test('single-tap target scores +1 and despawns', async ({ page }) => {
  await startRound(page);
  const item = await waitForLiveItem(page, 'bottom', 'tap');
  const before = (await readState(page)).scoreTeam;

  await tapItem(page, item);

  await waitForState(page, (s) => s.scoreTeam === before + 1, 'team score +1');
  const after = await readState(page);
  expect(after.scoreTeam).toBe(before + 1);
  expect(after.hudScoreTop).toBe(String(after.scoreTeam));
  expect(after.hudScoreBottom).toBe(String(after.scoreTeam));
  // the tapped target is gone from the live set
  expect(after.bottom.find((i) => i.cell === item.cell && i.type === 'tap')).toBeUndefined();
});

test('top target contributes to the same team score', async ({ page }) => {
  await startRound(page);
  const item = await waitForLiveItem(page, 'top', 'tap');
  const before = (await readState(page)).scoreTeam;

  await tapItem(page, item, 'top');

  await waitForState(page, (s) => s.scoreTeam === before + 1, 'team score +1 from top');
  const after = await readState(page);
  expect(after.hudScoreTop).toBe(String(after.scoreTeam));
  expect(after.hudScoreBottom).toBe(String(after.scoreTeam));
});

test('multi-tap target gives no partial credit', async ({ page }) => {
  await startRound(page);
  const item = await waitForLiveItem(page, 'bottom', 'multi2');
  const before = (await readState(page)).scoreTeam;

  await tapItem(page, item); // first of two taps
  await page.waitForTimeout(150);
  expect((await readState(page)).scoreTeam).toBe(before); // no points yet

  await tapItem(page, item); // completes it
  await waitForState(page, (s) => s.scoreTeam === before + 2, 'team score +2');
  expect((await readState(page)).scoreTeam).toBe(before + 2);
});

test('bomb applies a clamped penalty and stuns the half', async ({ page }) => {
  await startRound(page);
  const pair = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).__game.scene.keys['Duel'];
    scene.director.update = () => {};
    for (const half of [scene.halves.top, scene.halves.bottom]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of [...half.items] as any[]) item.destroy();
      half.items.clear();
    }
    scene.teamScore = 0;
    scene.halves.top.hud.setScore(0);
    scene.halves.bottom.hud.setScore(0);
    scene.halves.bottom.spawn('bomb', 4);
    scene.halves.bottom.spawn('tap', 0);
    const items = [...scene.halves.bottom.items];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toLiveItem = (item: any): LiveItem => ({
      x: item.x,
      y: item.y,
      cell: item.cellIndex,
      type: item.itemType,
      lifeMs: item.lifeMs,
    });
    return {
      bomb: toLiveItem(items.find((item) => item.itemType === 'bomb')),
      target: toLiveItem(items.find((item) => item.itemType === 'tap')),
    };
  });
  const beforeState = await readState(page);
  const before = beforeState.scoreTeam; // 0 this early in the round

  await tapItem(page, pair.bomb);
  await page.waitForTimeout(120);
  const afterBombState = await readState(page);
  const afterBomb = afterBombState.scoreTeam;
  expect(afterBomb).toBeGreaterThanOrEqual(0); // clamp — never goes negative
  expect(afterBomb).toBeLessThanOrEqual(before); // a bomb never scores points
  expect(afterBombState.mistakesBottom).toBe(beforeState.mistakesBottom + 1);
  expect(afterBombState.mistakesTop).toBe(beforeState.mistakesTop);
  expect(afterBombState.hudScoreTop).toBe(String(afterBomb));
  expect(afterBombState.hudScoreBottom).toBe(String(afterBomb));

  // A tap on a real target during the stun window is ignored.
  await tapItem(page, pair.target);
  await page.waitForTimeout(150);
  expect((await readState(page)).scoreTeam).toBe(afterBomb);
});

test('a missed (expired) target costs nothing', async ({ page }) => {
  await startRound(page);
  await waitForLiveItem(page, 'bottom', 'tap'); // ensure a target is up...
  const before = (await readState(page)).scoreTeam;

  // ...then never tap it; let it age out (tap lifeMs 1800 + blink + despawn).
  await page.waitForTimeout(2500);

  const after = await readState(page);
  expect(after.phase).toBe('play'); // still mid-round
  expect(after.scoreTeam).toBe(before); // expiry is free
});

test('clean play advances target CPS and lowers the spawn gap', async ({ page }) => {
  await startRound(page);
  const before = (await readState(page)).difficulty.bottom;

  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).__game.scene.keys['Duel'];
    for (let i = 0; i < 100; i++) scene.director.update(100);
  });

  const after = (await readState(page)).difficulty.bottom;
  expect(after.targetCps).toBeGreaterThan(before.targetCps);
  expect(after.spawnGapMs).toBeLessThan(before.spawnGapMs);
});

test('clean play reaches the high CPS ceiling by about 20 seconds', async ({ page }) => {
  await startRound(page);

  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).__game.scene.keys['Duel'];
    for (let i = 0; i < 200; i++) scene.director.update(100);
  });

  const after = (await readState(page)).difficulty.bottom;
  expect(after.targetCps).toBeGreaterThanOrEqual(3.95);
  expect(after.spawnGapMs).toBeLessThanOrEqual(400);
});

test('bomb tap resets only that player CPS velocity', async ({ page }) => {
  await startRound(page);
  const bomb = await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).__game.scene.keys['Duel'];
    for (let i = 0; i < 100; i++) scene.director.update(100);
    scene.director.update = () => {};
    for (const half of [scene.halves.top, scene.halves.bottom]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of [...half.items] as any[]) item.destroy();
      half.items.clear();
    }
    scene.halves.bottom.spawn('bomb', 4);
    const item = [...scene.halves.bottom.items][0];
    return { x: item.x, y: item.y, cell: item.cellIndex, type: item.itemType, lifeMs: item.lifeMs };
  });
  const beforeState = await readState(page);
  const before = beforeState.difficulty;
  expect(before.bottom.cpsVelocity).toBeGreaterThan(0);
  expect(before.top.cpsVelocity).toBeGreaterThan(0);

  await tapItem(page, bomb);
  await page.waitForTimeout(120);

  const afterState = await readState(page);
  const after = afterState.difficulty;
  expect(afterState.mistakesBottom).toBe(beforeState.mistakesBottom + 1);
  expect(afterState.mistakesTop).toBe(beforeState.mistakesTop);
  expect(after.bottom.cpsVelocity).toBe(0);
  expect(after.top.cpsVelocity).toBeGreaterThan(0);
});

test('expired non-bomb target resets only that player CPS velocity', async ({ page }) => {
  await startRound(page);
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).__game.scene.keys['Duel'];
    for (let i = 0; i < 100; i++) scene.director.update(100);
    scene.director.update = () => {};
    for (const half of [scene.halves.top, scene.halves.bottom]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of [...half.items] as any[]) item.destroy();
      half.items.clear();
    }
    scene.halves.bottom.spawn('tap', 4);
  });
  const beforeState = await readState(page);

  await page.waitForTimeout(2100);

  const afterState = await readState(page);
  const after = afterState.difficulty;
  expect(afterState.mistakesBottom).toBe(beforeState.mistakesBottom + 1);
  expect(afterState.mistakesTop).toBe(beforeState.mistakesTop);
  expect(after.bottom.cpsVelocity).toBe(0);
  expect(after.top.cpsVelocity).toBeGreaterThan(0);
});

test('expired bomb does not reset CPS velocity', async ({ page }) => {
  await startRound(page);
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).__game.scene.keys['Duel'];
    for (let i = 0; i < 100; i++) scene.director.update(100);
    scene.director.update = () => {};
    for (const half of [scene.halves.top, scene.halves.bottom]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of [...half.items] as any[]) item.destroy();
      half.items.clear();
    }
    scene.halves.bottom.spawn('bomb', 4);
  });
  const beforeState = await readState(page);
  const before = beforeState.difficulty.bottom.cpsVelocity;

  await page.waitForTimeout(2500);

  const afterState = await readState(page);
  const after = afterState.difficulty.bottom.cpsVelocity;
  expect(afterState.mistakesBottom).toBe(beforeState.mistakesBottom);
  expect(after).toBeGreaterThanOrEqual(before);
});

test('non-bomb lifetimes shrink as target CPS rises', async ({ page }) => {
  await startRound(page);
  const before = (await readState(page)).difficulty.bottom.lifeScale;

  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).__game.scene.keys['Duel'];
    for (let i = 0; i < 120; i++) scene.director.update(100);
  });

  const after = (await readState(page)).difficulty.bottom.lifeScale;
  expect(after).toBeLessThan(before);
});

test('phase machine runs ready → countdown → play → results', async ({ page }) => {
  test.setTimeout(ROUND_MS + 30_000);
  expect((await readState(page)).phase).toBe('ready');

  await tap(page, READY_TOP.x, READY_TOP.y);
  await tap(page, READY_BOTTOM.x, READY_BOTTOM.y);

  await waitForState(page, (s) => s.phase === 'countdown', 'countdown', 3_000);
  await waitForState(page, (s) => s.phase === 'play', 'play', 6_000);
  await waitForState(page, (s) => s.phase === 'results', 'results', ROUND_MS + 10_000);
});

test('visual baselines for the deterministic screens', async ({ page }) => {
  test.setTimeout(ROUND_MS + 30_000);

  // READY — static "TAP WHEN READY" on both seats.
  await expect(page).toHaveScreenshot('ready.png');

  // COUNTDOWN — capture the opening "3" beat (stable 0–800ms after ready-up).
  await tap(page, READY_TOP.x, READY_TOP.y);
  await tap(page, READY_BOTTOM.x, READY_BOTTOM.y);
  await page.waitForTimeout(300); // pop tween settled, well before "2"
  await expect(page).toHaveScreenshot('countdown.png');

  // RESULTS — force a clean zero-score card; the full-round path is covered above.
  await waitForState(page, (s) => s.phase === 'play', 'play phase', 8_000);
  await page.waitForTimeout(800); // let the countdown banner fade out
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scene = (window as any).__game.scene.keys['Duel'];
    const transientText = ['3', '2', '1', 'GO!'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const destroyTransientText = (root: any): void => {
      if (root.type === 'Text' && transientText.includes(root.text)) {
        root.destroy();
        return;
      }
      if (!root.list) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const child of [...root.list] as any[]) destroyTransientText(child);
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const child of [...scene.children.list] as any[]) destroyTransientText(child);
    for (const half of [scene.halves.top, scene.halves.bottom]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of [...half.items] as any[]) {
        item.removeAll(true);
        item.destroy();
      }
      half.items.clear();
    }
    scene.teamScore = 0;
    scene.halves.top.hud.setScore(0);
    scene.halves.bottom.hud.setScore(0);
    scene.endRound();
  });
  await page.waitForTimeout(400); // cards built
  await expect(page).toHaveScreenshot('results.png');
});
