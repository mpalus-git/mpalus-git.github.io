import { expect, test, type Page } from "@playwright/test";
import { mockApi, newPageContext, sitePages, trackErrors } from "./support";

async function loadAllImages(page: Page): Promise<void> {
  for (const image of await page.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
  }
  await page.waitForLoadState("networkidle");
}

for (const [path, locale] of [
  ["/", "pl-PL"],
  ["/en/", "en-US"],
] as const) {
  test(`loads every image on ${path} with known dimensions and alt text`, async ({ browser }) => {
    const context = await browser.newContext({ locale });
    await mockApi(context);
    const page = await context.newPage();
    const errors = trackErrors(page);
    await page.goto(path);

    await loadAllImages(page);
    const images = await page.locator("img").evaluateAll((elements: HTMLImageElement[]) =>
      elements.map((image) => {
        return {
          src: image.currentSrc,
          alt: image.alt,
          width: image.getAttribute("width"),
          height: image.getAttribute("height"),
          loading: image.loading,
          naturalWidth: image.naturalWidth,
        };
      }),
    );

    expect(images).toHaveLength(2);
    for (const image of images) {
      expect(image.naturalWidth).toBeGreaterThan(0);
      expect(image.src).toMatch(/\.(avif|webp)$/);
      expect(image.alt.length).toBeGreaterThan(20);
      expect(Number(image.width)).toBeGreaterThan(0);
      expect(Number(image.height)).toBeGreaterThan(0);
      expect(image.loading).toBe("lazy");
    }
    await expect(
      page.getByRole("img", { name: /^(Architektura FixFlow\.Api|FixFlow\.Api architecture)/ }),
    ).toBeVisible();
    expect(errors).toEqual([]);
    await context.close();
  });
}

test("does not shift the layout while card images load", async ({ browser }) => {
  const context = await browser.newContext({ locale: "pl-PL" });
  await mockApi(context);
  const page = await context.newPage();
  await page.route(/\.(avif|webp)$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.goto("/");
  const card = page.getByRole("heading", { level: 3, name: "FixFlow.Mobile" });
  await card.scrollIntoViewIfNeeded();
  const before = await card.boundingBox();

  await loadAllImages(page);

  expect(await card.boundingBox()).toEqual(before);
  await context.close();
});

for (const path of sitePages) {
  test(`gives lazy images on ${path} explicit dimensions for the browser`, async ({ browser }) => {
    const context = await newPageContext(browser, path);
    const page = await context.newPage();
    const session = await context.newCDPSession(page);
    const issues: string[] = [];
    session.on("Audits.issueAdded", ({ issue }) => {
      if (issue.code === "LazyLoadImageIssue") {
        issues.push(issue.details.lazyLoadImageIssueDetails?.url ?? "");
      }
    });
    await session.send("Audits.enable");
    await page.goto(path);

    await loadAllImages(page);

    expect(issues).toEqual([]);
    await context.close();
  });
}
