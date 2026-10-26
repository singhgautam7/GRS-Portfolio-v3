import { defineConfig, devices } from '@playwright/test';

/** E2E, accessibility and visual tests against the static export (`bun run build` first). */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  workers: 3,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  webServer: { command: 'python3 -m http.server 4173 -d out', port: 4173, reuseExistingServer: true },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } }, testMatch: /mobile\.spec/ },
  ],
});
