import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { mockApi, trackErrors } from "./support";

type ContextOptions = {
  locale: string;
  languages?: readonly string[];
  userAgent?: string;
  blockStorage?: boolean;
  javaScriptEnabled?: boolean;
};

async function createContext(browser: Browser, options: ContextOptions): Promise<BrowserContext> {
  const context = await browser.newContext({
    locale: options.locale,
    javaScriptEnabled: options.javaScriptEnabled ?? true,
    ...(options.userAgent ? { userAgent: options.userAgent } : {}),
  });
  await mockApi(context);
  if (options.languages) {
    await context.addInitScript((languages) => {
      Object.defineProperty(Navigator.prototype, "languages", { get: () => languages });
    }, options.languages);
  }
  if (options.blockStorage) {
    await context.addInitScript(() => {
      for (const name of ["localStorage", "sessionStorage"]) {
        Object.defineProperty(window, name, {
          get: () => {
            throw new DOMException("Storage is blocked", "SecurityError");
          },
        });
      }
    });
  }
  return context;
}

async function expectPath(page: Page, path: string): Promise<void> {
  await page.waitForLoadState("networkidle");
  const url = new URL(page.url());
  expect(url.pathname + url.hash).toBe(path);
}

test.describe("language detection on entry", () => {
  const polishBrowsers: [string, readonly string[] | undefined][] = [
    ["pl-PL", undefined],
    ["en-US", ["en-US", "pl"]],
    ["en-GB", ["en-GB", "de-DE", "pl-PL"]],
  ];
  for (const [locale, languages] of polishBrowsers) {
    test(`stays on Polish pages for ${locale} ${languages?.join(",") ?? ""}`, async ({
      browser,
    }) => {
      const context = await createContext(browser, { locale, ...(languages ? { languages } : {}) });
      const page = await context.newPage();
      const errors = trackErrors(page);

      await page.goto("/");

      await expectPath(page, "/");
      expect(errors).toEqual([]);
      await context.close();
    });
  }

  for (const locale of ["en-US", "de-DE"]) {
    test(`redirects ${locale} to English pages keeping the hash`, async ({ browser }) => {
      const context = await createContext(browser, { locale });
      const page = await context.newPage();
      const errors = trackErrors(page);

      await page.goto("/#fixflow");

      await expectPath(page, "/en/#fixflow");
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      expect(errors).toEqual([]);
      await context.close();
    });
  }

  test("redirects the Polish 404 page to the English one", async ({ browser }) => {
    const context = await createContext(browser, { locale: "en-US" });
    const page = await context.newPage();

    await page.goto("/404.html");

    await expectPath(page, "/en/404/");
    await context.close();
  });

  test("redirects a project page to its English counterpart keeping the hash", async ({
    browser,
  }) => {
    const context = await createContext(browser, { locale: "de-DE" });
    const page = await context.newPage();

    await page.goto("/fixflow-mobile/#demo-heading");

    await expectPath(page, "/en/fixflow-mobile/#demo-heading");
    await context.close();
  });

  test("redirects English pages to Polish for a Polish browser", async ({ browser }) => {
    const context = await createContext(browser, { locale: "pl-PL" });
    const page = await context.newPage();

    await page.goto("/en/404/");

    await expectPath(page, "/404.html");
    await context.close();
  });

  test("does not leave the wrong language in history", async ({ browser }) => {
    const context = await createContext(browser, { locale: "en-US" });
    const page = await context.newPage();
    await page.goto("about:blank");
    await page.goto("/");
    await expectPath(page, "/en/");

    await page.goBack();

    expect(page.url()).toBe("about:blank");
    await context.close();
  });

  test("does not redirect robots", async ({ browser }) => {
    const context = await createContext(browser, {
      locale: "en-US",
      userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    });
    const page = await context.newPage();

    await page.goto("/");

    await expectPath(page, "/");
    await context.close();
  });
});

test.describe("language switch", () => {
  test("remembered choice wins over the browser language on the next visit", async ({
    browser,
  }) => {
    const context = await createContext(browser, { locale: "pl-PL" });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("link", { name: "English" }).click();
    await expectPath(page, "/en/");

    const nextVisit = await context.newPage();
    await nextVisit.goto("/");

    await expectPath(nextVisit, "/en/");
    await context.close();
  });

  test("internal navigation never switches the language", async ({ browser }) => {
    const context = await createContext(browser, { locale: "en-US" });
    const page = await context.newPage();
    await page.goto("/");
    await expectPath(page, "/en/");

    await page.getByRole("link", { name: "Polski" }).click();
    await expectPath(page, "/");
    await page.getByRole("link", { name: "Mateusz Palus" }).click();

    await expectPath(page, "/");
    await context.close();
  });

  test("works without a loop when storage is blocked", async ({ browser }) => {
    const context = await createContext(browser, { locale: "en-US", blockStorage: true });
    const page = await context.newPage();
    const errors = trackErrors(page);
    let navigations = 0;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) {
        navigations += 1;
      }
    });

    await page.goto("/");
    await expectPath(page, "/en/");
    expect(navigations).toBe(2);

    await page.getByRole("link", { name: "Polski" }).click();
    await expectPath(page, "/");
    expect(navigations).toBe(3);
    expect(errors).toEqual([]);
    await context.close();
  });

  test("works as plain links without JavaScript", async ({ browser }) => {
    const context = await createContext(browser, { locale: "en-US", javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto("/");
    await expectPath(page, "/");
    await page.getByRole("link", { name: "English" }).click();

    await expectPath(page, "/en/");
    await context.close();
  });

  const counterparts: [string, "pl" | "en", string][] = [
    ["/", "pl", "/en/"],
    ["/en/", "en", "/"],
    ["/404.html", "pl", "/en/404/"],
    ["/en/404/", "en", "/404.html"],
    ["/fixflow-api/", "pl", "/en/fixflow-api/"],
    ["/en/fixflow-web/", "en", "/fixflow-web/"],
  ];
  for (const [path, language, counterpart] of counterparts) {
    test(`on ${path} marks ${language} and leads to ${counterpart}`, async ({ browser }) => {
      const context = await createContext(browser, {
        locale: language === "pl" ? "pl-PL" : "en-US",
      });
      const page = await context.newPage();
      const errors = trackErrors(page);
      await page.goto(path);
      await expectPath(page, path);

      await expect(page.locator('nav [aria-current="page"]')).toHaveText(
        new RegExp(`^${language.toUpperCase()}`),
      );
      await page.getByRole("link", { name: language === "pl" ? "English" : "Polski" }).click();

      await expectPath(page, counterpart);
      await expect(page.locator("html")).toHaveAttribute("lang", language === "pl" ? "en" : "pl");
      expect(errors).toEqual([]);
      await context.close();
    });
  }
});
