import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 360_000,
  // The CI container terminates HTTPS with a private CA; real browsers receive
  // Hugging Face's normal public certificate.
  use: { baseURL: "http://127.0.0.1:4173", headless: true, ignoreHTTPSErrors: true },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
