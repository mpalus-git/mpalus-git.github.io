import { expect, test } from "@playwright/test";
import { mockApi, trackErrors } from "./support";

const pages = [
  {
    path: "/",
    locale: "pl-PL",
    demoName: /Demo panelu FixFlow/,
    demoHref: "https://fix-flow-web.vercel.app",
  },
  {
    path: "/en/",
    locale: "en-US",
    demoName: /FixFlow panel demo/,
    demoHref: "https://fix-flow-web.vercel.app/?lang=en",
  },
] as const;

for (const { path, locale, demoName, demoHref } of pages) {
  test.describe(`home page ${path}`, () => {
    test("shows the opening section, the FixFlow section and three project cards", async ({
      browser,
    }) => {
      const context = await browser.newContext({ locale });
      await mockApi(context);
      const page = await context.newPage();
      const errors = trackErrors(page);

      await page.goto(path);

      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mateusz Palus");
      await expect(page.getByRole("heading", { level: 2, name: "FixFlow" })).toBeVisible();
      await expect(
        page.getByRole("img", {
          name: /^(Architektura systemu FixFlow|FixFlow system architecture)/,
        }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { level: 3 })).toHaveText([
        "FixFlow.Api",
        "FixFlow.Web",
        "FixFlow.Mobile",
      ]);
      await expect(page.getByRole("link", { name: demoName })).toHaveAttribute("href", demoHref);
      expect(errors).toEqual([]);
      await context.close();
    });

    test("opens every external link in a new tab", async ({ browser }) => {
      const context = await browser.newContext({ locale });
      await mockApi(context);
      const page = await context.newPage();
      await page.goto(path);

      const externalLinks = page.locator('main a[href^="https://"], footer a[href^="https://"]');

      expect(await externalLinks.count()).toBeGreaterThanOrEqual(8);
      for (const link of await externalLinks.all()) {
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", "noopener");
      }
      await context.close();
    });

    test("wakes the API again when a demo link is hovered after five minutes", async ({
      browser,
    }) => {
      const context = await browser.newContext({ locale });
      const requests = await mockApi(context);
      const page = await context.newPage();
      await page.clock.install();
      await page.goto(path);
      await expect.poll(() => requests.length).toBe(1);

      await page.getByRole("link", { name: demoName }).hover();
      expect(requests).toHaveLength(1);

      await page.mouse.move(0, 0);
      await page.clock.fastForward("05:01");
      await page.getByRole("link", { name: demoName }).hover();

      await expect.poll(() => requests.length).toBe(2);
      await context.close();
    });
  });
}
