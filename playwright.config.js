import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: true,

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: "html",

  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    serviceWorkers: "block",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],

  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort --mode test",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
    env: {
      ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("VITE_"))),
      VITE_SUPABASE_URL: "https://supabase.invalid",
      VITE_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
    },
  },
});
