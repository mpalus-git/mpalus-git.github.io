import { expect, test, type Browser } from "@playwright/test";
import { newPageContext, sitePages } from "./support";

async function screenshot(browser: Browser, path: string, colorScheme: "light" | "dark") {
  const context = await newPageContext(browser, path, {
    viewport: { width: 360, height: 780 },
    colorScheme,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(path);
  for (const image of await page.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
  }
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await Promise.all([...document.images].map((image) => image.decode()));
    window.scrollTo(0, 0);
  });
  const image = await page.screenshot({
    fullPage: true,
    animations: "disabled",
    mask: [page.locator("img, video")],
  });
  await context.close();
  return image;
}

for (const path of sitePages) {
  test(`keeps the light look of ${path} in a dark browser`, async ({ playwright }) => {
    const lightBrowser = await playwright.chromium.launch({ channel: "chromium" });
    const darkBrowser = await playwright.chromium.launch({
      channel: "chromium",
      args: ["--blink-settings=forceDarkModeEnabled=true"],
    });

    const light = await screenshot(lightBrowser, path, "light");
    const dark = await screenshot(darkBrowser, path, "dark");
    await lightBrowser.close();
    await darkBrowser.close();

    expect(dark.equals(light)).toBe(true);
  });
}
