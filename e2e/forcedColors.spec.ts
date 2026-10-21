import { expect, test, type Page } from "@playwright/test";
import { newPageContext, sitePages } from "./support";

const heroPages = ["/", "/en/", "/fixflow-api/", "/en/fixflow-mobile/"];
const diagramPages = ["/", "/en/", "/fixflow-api/", "/en/fixflow-api/", "/fixflow-web/"];
const palettes = ["light", "dark"] as const;

async function openForced(
  browser: Parameters<typeof newPageContext>[0],
  path: string,
  colorScheme: (typeof palettes)[number],
): Promise<Page> {
  const context = await newPageContext(browser, path, {
    viewport: { width: 360, height: 780 },
    colorScheme,
    forcedColors: "active",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(path);
  return page;
}

async function systemColors(page: Page) {
  return page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return { text: style.color, canvas: style.backgroundColor };
  });
}

for (const colorScheme of palettes) {
  for (const path of sitePages) {
    test(`marks the active language in forced colors on ${path} (${colorScheme})`, async ({
      browser,
    }) => {
      const page = await openForced(browser, path, colorScheme);
      const colors = await systemColors(page);
      const active = await page.locator("header [aria-current='page']").evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          width: style.borderTopWidth,
          border: style.borderTopColor,
          decoration: style.textDecorationLine,
        };
      });

      expect(active).toEqual({ width: "2px", border: colors.text, decoration: "underline" });
      await page.context().close();
    });
  }

  for (const path of heroPages) {
    test(`outlines the hero buttons in forced colors on ${path} (${colorScheme})`, async ({
      browser,
    }) => {
      const page = await openForced(browser, path, colorScheme);
      const borders = await page
        .locator("main > section")
        .first()
        .locator("a[target='_blank']")
        .evaluateAll((links) => links.map((link) => getComputedStyle(link).borderTopWidth));

      expect(borders.length).toBeGreaterThanOrEqual(2);
      expect(borders).toEqual(borders.map(() => "2px"));
      await page.context().close();
    });
  }

  for (const path of diagramPages) {
    test(`draws diagrams in system colors on ${path} (${colorScheme})`, async ({ browser }) => {
      const page = await openForced(browser, path, colorScheme);
      const colors = await systemColors(page);
      const used = await page.locator("svg[aria-labelledby]").evaluateAll((diagrams) =>
        diagrams.flatMap((diagram) =>
          [...diagram.querySelectorAll("rect, text, path, line")].flatMap((shape) => {
            const style = getComputedStyle(shape);
            return [style.fill, style.stroke];
          }),
        ),
      );

      expect(used.length).toBeGreaterThan(0);
      expect(new Set(used.filter((color) => color !== "none"))).toEqual(
        new Set([colors.text, colors.canvas]),
      );
      await page.context().close();
    });
  }
}
