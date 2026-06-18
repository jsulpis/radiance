import { defineConfig, devices } from "@playwright/test";

const desktopViewport = { width: 700, height: 400 };
const mobileViewport = { width: 360, height: 640 };

const serverUrl = "http://localhost:3000";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { host: "0.0.0.0" }]],
  use: {
    trace: "on-first-retry",
    baseURL: serverUrl,
  },
  snapshotPathTemplate: "{testDir}/__screenshots__/{testName}/{testName}-{projectName}{ext}",
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: desktopViewport,
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: desktopViewport,
        launchOptions: {
          headless: false,
        },
      },
      grepInvert: /play \/ pause controls/, // Flaky on firefox, and there is no fancy API in the play/pause controls, so the other browsers should be enough
    },
    {
      name: "safari",
      use: { ...devices["Desktop Safari"], viewport: desktopViewport },
      // - the video does not work in the docker image used for the CI, maybe due to a codec issue
      // - issues with offscreen canvas and WebGL in Safari < 17
      grepInvert: /video|offscreencanvas/,
    },
    {
      name: "android",
      use: {
        ...devices["Pixel 5"],
        viewport: mobileViewport,
      },
    },
    {
      name: "iphone",
      use: { ...devices["iPhone 12"], viewport: mobileViewport },
      // - the video does not work in the docker image used for the CI, maybe due to a codec issue
      // - issues with offscreen canvas and WebGL in Safari < 17
      grepInvert: /video|offscreencanvas/,
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: serverUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 20 * 1000,
  },
});
