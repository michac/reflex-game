import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test config for Reflex Duel. Drives the game in a Pixel-6-sized
 * touch viewport, auto-starts the Vite dev server, and tolerates sub-pixel
 * font AA when diffing the deterministic-phase screenshots.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  expect: {
    // Sub-pixel font antialiasing varies frame-to-frame; allow a little slack.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  use: {
    // Dedicated test port (not Vite's default 5173) so the suite never
    // collides with another Vite dev server already running on this machine.
    baseURL: 'http://localhost:5180',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Logical game size (FIT scale), so canvas coords == page coords.
        viewport: { width: 360, height: 740 },
        hasTouch: true,
        // Phaser boots its WebGL renderer; headless Chromium's default GL
        // can't allocate the framebuffer ("Framebuffer Unsupported" → context
        // lost → scene never starts). ANGLE-over-SwiftShader gives a working
        // software GL so the game actually renders.
        launchOptions: {
          args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 5180 --strictPort',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
  },
});
