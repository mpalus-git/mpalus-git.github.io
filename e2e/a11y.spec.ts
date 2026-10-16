import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { newPageContext, sitePages } from "./support";

const widths = [360, 1440];

for (const path of sitePages) {
  for (const width of widths) {
    test(`has no serious accessibility violations on ${path} at ${String(width)} px`, async ({
      browser,
    }) => {
      const context = await newPageContext(browser, path, {
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      await page.goto(path);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
        .analyze();
      const violations = results.violations
        .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
        .map((violation) => ({
          rule: violation.id,
          targets: violation.nodes.map((node) => node.target.join(" ")),
        }));

      expect(violations).toEqual([]);
      await context.close();
    });
  }
}

for (const path of sitePages) {
  test(`gives links with the same name the same target on ${path}`, async ({ browser }) => {
    const context = await newPageContext(browser, path);
    const page = await context.newPage();
    await page.goto(path);

    const targets = new Map<string, Set<string>>();
    for (const link of await page.getByRole("link").all()) {
      const [line = ""] = (await link.ariaSnapshot()).split("\n");
      const name = /link "(.*)"/.exec(line)?.[1] ?? "";
      const href = (await link.getAttribute("href")) ?? "";
      targets.set(name, (targets.get(name) ?? new Set()).add(href));
    }
    const ambiguous = [...targets].filter(([, hrefs]) => hrefs.size > 1).map(([name]) => name);

    expect(targets.size).toBeGreaterThan(3);
    expect(ambiguous).toEqual([]);
    await context.close();
  });
}
