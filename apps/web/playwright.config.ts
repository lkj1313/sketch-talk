import { defineConfig, devices } from "@playwright/test";

const API_SERVER_URL = "http://localhost:3000/api/v1";
const WEB_SERVER_URL = "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: WEB_SERVER_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm --dir ../api start",
      url: API_SERVER_URL,
      env: {
        NODE_ENV: "test",
        WEB_ORIGIN: WEB_SERVER_URL,
        WORD_AUTO_GENERATION_ENABLED: "false",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm dev --host localhost --port 5173 --strictPort",
      url: WEB_SERVER_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
