import { test, expect } from "@playwright/test";

import { routes } from "../playground/src/components/routes";

const ignoreRoutes = new Set([
  "pause",
  "dataTexture",
  "particles - FBO",
  "boids",
  "hero",
  "htmlTexture2D", // covered by the dedicated "html texture" test below
  "htmlTexture3D", // covered by the dedicated "html texture 3D" test below
]);

const routesToTest = routes.filter(({ route }) => !ignoreRoutes.has(route));

const expectedRendersByDemo = {
  scissor: "2",
  video: "2",
  "particles - FBO (static)": "2",
  "boids (static)": "3",
  texture: "2",
  offscreencanvas: "2",
  alpha: "2",
  blending: "2",
  trails: "90",
  fxaa: "2",
  dither: "7",
};

for (const { section, route } of routesToTest) {
  test(route, async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/${section}/${route}`);

    await expect(page.locator("#renders strong")).toHaveText(expectedRendersByDemo[route] || "1", {
      timeout: 10_000,
    });
    await expect(page.locator("main")).toHaveScreenshot();
  });
}

// HTML-in-Canvas is an incubation behind a flag: the test skips itself where the
// API is missing (firefox, safari, mobile projects, unflagged chromium).
test("html texture", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/textures/htmlTexture2D`);

  const supported = await page.evaluate(() => "captureElementImage" in HTMLCanvasElement.prototype);
  test.skip(!supported, "requires the HTML-in-Canvas API (chrome://flags/#canvas-draw-element)");

  await expect(page.locator("#renderCount")).not.toHaveText("0", { timeout: 10_000 });
  await expect(page.locator("main")).toHaveScreenshot();

  // the element stays hit-testable where its pixels are drawn
  const hitTest = await page.evaluate(() => {
    const canvas = document.querySelector("canvas")!;
    const card = document.querySelector("#card")!;
    const rect = canvas.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return card.contains(hit);
  });
  expect(hitTest).toBe(true);

  // a DOM update fires a paint event, which repaints the texture and re-renders
  const before = Number(await page.locator("#renderCount").textContent());
  await page
    .getByRole("textbox", { name: "Card text" })
    .fill("The DOM changed, so the texture was repainted.");
  await expect
    .poll(async () => Number(await page.locator("#renderCount").textContent()))
    .toBeGreaterThan(before);
});

test("html texture 3D", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/textures/htmlTexture3D`);

  const supported = await page.evaluate(() => "captureElementImage" in HTMLCanvasElement.prototype);
  test.skip(!supported, "requires the HTML-in-Canvas API (chrome://flags/#canvas-draw-element)");

  await expect(page.locator("#renderCount")).not.toHaveText("0", { timeout: 10_000 });

  // each element is hit-testable where its quad is drawn, not where the layout puts it
  const hitTest = await page.evaluate(() => {
    const canvas = document.querySelector("canvas")!;
    const card = document.querySelector("#card")!;
    const card2 = document.querySelector("#card2")!;
    const rect = canvas.getBoundingClientRect();
    const corner = document.elementFromPoint(rect.x + 4, rect.y + 4);
    const center = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    const hits = { card: false, card2: false };
    for (let i = 1; i < 10; i++) {
      for (let j = 1; j < 10; j++) {
        const hit = document.elementFromPoint(
          rect.x + (rect.width * i) / 10,
          rect.y + (rect.height * j) / 10,
        );
        hits.card ||= card.contains(hit);
        hits.card2 ||= card2.contains(hit);
      }
    }
    return { center: card.contains(center), corner: card.contains(corner), ...hits };
  });
  expect(hitTest).toEqual({ center: true, corner: false, card: true, card2: true });

  // a DOM update repaints both textures, so both cards re-render on the next frame
  const before = Number(await page.locator("#renderCount").textContent());
  await page.getByRole("textbox", { name: "Card text" }).fill("Both textures follow the DOM.");
  await expect
    .poll(async () => Number(await page.locator("#renderCount").textContent()))
    .toBeGreaterThan(before);
  await expect(page.locator("#card p")).toHaveText("Both textures follow the DOM.");
  await expect(page.locator("#card2 p")).toHaveText("Both textures follow the DOM.");
});

test("pointer move", async ({ page, viewport, baseURL }) => {
  await page.goto(`${baseURL}/pointer/pointer`);

  await expect(page.getByText("Renders: 1")).toBeVisible();

  await page.mouse.move((viewport?.width || 0) * 0.5, (viewport?.height || 0) * 0.45);

  await expect(page.getByText("Renders: 2")).toBeVisible();

  await page.mouse.down();

  await page.waitForTimeout(100);

  await expect(page.locator("main")).toHaveScreenshot();
});

test("play / pause controls - local", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/core/pause`);

  await expect(page.getByText("Renders: 1")).toBeVisible();

  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const playPauseBtn = document.querySelector<HTMLButtonElement>(
        ".controls.local button:nth-of-type(1)",
      )!;

      playPauseBtn.click();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              playPauseBtn.click();
              resolve();
            });
          });
        });
      });
    });
  });

  await expect(page.getByText("Renders: 5")).toBeVisible();

  await expect(page.locator("main")).toHaveScreenshot();
});

test("play / pause controls - global", async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/core/pause`);

  await expect(page.getByText("Renders: 1")).toBeVisible();

  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      const playPauseBtn = document.querySelector<HTMLButtonElement>(".controls.global button")!;

      playPauseBtn.click();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              playPauseBtn.click();
              resolve();
            });
          });
        });
      });
    });
  });

  await expect(page.getByText("Renders: 5")).toBeVisible();

  await expect(page.locator("main")).toHaveScreenshot();
});
