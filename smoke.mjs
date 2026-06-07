// Throwaway smoke test: boot the game headless, capture console errors,
// ready up both seats, run the countdown, verify mirrored spawns, land a
// tap on a real target, screenshot each phase.
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const pwRoot = join(process.env.LOCALAPPDATA, 'ms-playwright');
const chromeDir = readdirSync(pwRoot).filter((d) => d.startsWith('chromium-')).sort().pop();
const exe = join(pwRoot, chromeDir, 'chrome-win', 'chrome.exe');

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: 360, height: 740 }, hasTouch: true });

const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

const url = process.env.SMOKE_URL ?? 'http://localhost:5173';
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('#game canvas', { timeout: 15000 });
await page.waitForTimeout(1200); // let a few frames render
await page.screenshot({ path: 'smoke-ready.png' });

// Canvas fills the 360x740 viewport 1:1 (FIT), so game coords == page coords.
const canvas = await page.$('#game canvas');
const box = await canvas.boundingBox();
const sx = box.width / 360, sy = box.height / 740;
const gx = (x) => box.x + x * sx, gy = (y) => box.y + y * sy;
const tap = async (x, y) => { await page.mouse.click(gx(x), gy(y)); };

// ready up both seats
await tap(180, 200); // top half
await tap(180, 540); // bottom half
await page.waitForTimeout(400);
await page.screenshot({ path: 'smoke-countdown.png' });

// countdown: 3 steps x 800ms, play starts on "GO!"
await page.waitForTimeout(2400);

// let some items spawn
await page.waitForTimeout(2600);
await page.screenshot({ path: 'smoke-play.png' });

const readState = () =>
  page.evaluate(() => {
    const scene = window.__game.scene.keys['Duel'];
    const dump = (half) =>
      [...half.items].filter((i) => i.isLive).map((i) => ({
        x: i.x, y: i.y, cell: i.cellIndex, type: i.itemType,
      }));
    return {
      phase: scene.phase,
      top: dump(scene.halves.top),
      bottom: dump(scene.halves.bottom),
      scoreTop: scene.halves.top.score,
      scoreBottom: scene.halves.bottom.score,
    };
  });

const s1 = await readState();
console.log('phase:', s1.phase);
console.log('top items:   ', JSON.stringify(s1.top));
console.log('bottom items:', JSON.stringify(s1.bottom));
const cells = (items) => items.map((i) => `${i.cell}:${i.type}`).sort().join(',');
console.log('mirrored:', cells(s1.top) === cells(s1.bottom) ? 'YES' : 'NO — MISMATCH');

// tap a real (non-bomb) target on the bottom half: screen y = local y + 370
const target = s1.bottom.find((i) => i.type !== 'bomb');
if (target) {
  await tap(target.x, target.y + 370);
  await page.waitForTimeout(250);
  const s2 = await readState();
  console.log(`tap test: bottom score ${s1.scoreBottom} -> ${s2.scoreBottom},`,
    `bottom items ${s1.bottom.length} -> ${s2.bottom.length}`);
} else {
  console.log('tap test: skipped (only bombs on screen)');
}
await page.screenshot({ path: 'smoke-tapped.png' });

console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
