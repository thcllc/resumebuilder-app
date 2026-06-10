import { defineConfig } from "playwright/test";

const previewPort = process.env.PLAYWRIGHT_PORT ?? "49217";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${previewPort}`;
const useExternalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const outputDir =
  process.env.PLAYWRIGHT_OUTPUT_DIR ??
  (useExternalServer ? "test-results/deployed" : "test-results/local");

export default defineConfig({
  testDir: "./tests",
  outputDir,
  timeout: 30_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: useExternalServer
    ? undefined
    : {
        command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${previewPort}`,
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
