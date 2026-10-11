import { expect, test, type Page } from "@playwright/test";
import { newPageContext, sitePages, trackErrors } from "./support";

async function collectInternalResources(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const addresses = new Set<string>();
    const add = (value: string | null): void => {
      if (value) {
        const url = new URL(value, location.href);
        if (url.origin === location.origin) {
          url.hash = "";
          addresses.add(url.href);
        }
      }
    };
    for (const element of document.querySelectorAll("a[href], link[rel='icon']")) {
      add(element.getAttribute("href"));
    }
    for (const element of document.querySelectorAll("img[src], video source[src]")) {
      add(element.getAttribute("src"));
    }
    for (const element of document.querySelectorAll("video[poster]")) {
      add(element.getAttribute("poster"));
    }
    for (const element of document.querySelectorAll("[srcset]")) {
      for (const candidate of (element.getAttribute("srcset") ?? "").split(",")) {
        add(candidate.trim().split(/\s+/)[0] ?? null);
      }
    }
    return [...addresses];
  });
}

for (const path of sitePages) {
  test(`loads ${path} with every internal link and resource and no CSP violations`, async ({
    browser,
  }) => {
    const context = await newPageContext(browser, path);
    await context.addInitScript(() => {
      const violations: string[] = [];
      Object.defineProperty(window, "cspViolations", { value: violations });
      document.addEventListener("securitypolicyviolation", (event) => {
        violations.push(`${event.violatedDirective} ${event.blockedURI}`);
      });
    });
    const page = await context.newPage();
    const errors = trackErrors(page);
    const failures: string[] = [];
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failures.push(`${String(response.status())} ${response.url()}`);
      }
    });

    await page.goto(path);
    for (const image of await page.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
    }
    await page.waitForLoadState("networkidle");

    const resources = await collectInternalResources(page);
    expect(resources.length).toBeGreaterThanOrEqual(3);
    for (const resource of resources) {
      const response = await page.request.get(resource);
      expect(response.status(), resource).toBe(200);
    }
    expect(await page.evaluate((): unknown => Reflect.get(window, "cspViolations"))).toEqual([]);
    expect(failures).toEqual([]);
    expect(errors).toEqual([]);
    await context.close();
  });
}
