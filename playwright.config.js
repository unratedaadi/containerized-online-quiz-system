import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "ui.spec.js",
  workers: 1,
  use: {
    channel: "chrome",
    baseURL: "http://localhost:5180",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "SUPABASE_LEADERBOARD_URL= QUIZROOM_SYNC_TOKEN= DEMO_MODE=true PORT=3102 API_PORT=3102 VITE_PORT=5180 DB_PATH=:memory: npm run dev",
    url: "http://localhost:5180",
    reuseExistingServer: false,
    timeout: 30000,
  },
  reporter: "list",
});
