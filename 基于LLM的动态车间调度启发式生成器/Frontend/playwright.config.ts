import { defineConfig, devices } from "@playwright/test";

// Local: default http://127.0.0.1:3000, webServer starts or reuses. Docker: set
// PLAYWRIGHT_BASE_URL (e.g. http://localhost:3000) and PLAYWRIGHT_NO_WEB_SERVER=1
// so Playwright does not start the dev server; set API_BASE_URL in e2e for backend.
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  retries: 1,
  webServer: process.env.PLAYWRIGHT_NO_WEB_SERVER
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use locally installed Chrome instead of Playwright-bundled Chromium
        channel: "chrome",
      },
    },
  ],
});
