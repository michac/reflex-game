import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so a built bundle works from any static folder.
  base: './',
  // Expose on the LAN so the Pixel 6 can hit http://<PC-IP>:5173 during dev.
  server: { host: true },
});
