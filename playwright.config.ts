import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end journeys, run after every migration phase:
 *   npm run test:e2e
 * Needs the app running (BASE_URL, default http://localhost:3000) and DATABASE_URI pointing at the
 * same database, so tests can read email-confirmation and reset tokens instead of opening an inbox.
 */
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: process.env.BASE_URL || "http://localhost:3000", trace: "off", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
