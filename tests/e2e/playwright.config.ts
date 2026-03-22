import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    extraHTTPHeaders: {
      "x-tenant-id": "e2e-test",
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "cd ../../../budget_3.0 && node dist/index.js",
      port: 4000,
      timeout: 30_000,
      reuseExistingServer: true,
    },
    {
      command: "npm run dev",
      port: 3000,
      timeout: 30_000,
      reuseExistingServer: true,
    },
  ],
});
