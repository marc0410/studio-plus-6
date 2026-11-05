import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev",
    url: `${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/connexion`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { APP_URL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000" },
  },
});
