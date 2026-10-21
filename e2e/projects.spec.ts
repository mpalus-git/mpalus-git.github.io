import { expect, test, type Page } from "@playwright/test";
import { mockApi, trackErrors } from "./support";

const projects = [
  {
    path: "/fixflow-api/",
    locale: "pl-PL",
    title: "FixFlow.Api",
    sections: [
      "Jaki problem rozwiązuje",
      "Decyzje techniczne",
      "Architektura",
      "Wersja demo",
      "Pozostałe części FixFlow",
    ],
    images: 0,
    videos: 0,
    home: "/#fixflow",
  },
  {
    path: "/en/fixflow-api/",
    locale: "en-US",
    title: "FixFlow.Api",
    sections: [
      "What problem it solves",
      "Technical decisions",
      "Architecture",
      "Demo",
      "Other parts of FixFlow",
    ],
    images: 0,
    videos: 0,
    home: "/en/#fixflow",
  },
  {
    path: "/fixflow-web/",
    locale: "pl-PL",
    title: "FixFlow.Web",
    sections: [
      "Jaki problem rozwiązuje",
      "Decyzje techniczne",
      "Jak to wygląda",
      "Wersja demo",
      "Pozostałe części FixFlow",
    ],
    images: 5,
    videos: 1,
    home: "/#fixflow",
  },
  {
    path: "/en/fixflow-web/",
    locale: "en-US",
    title: "FixFlow.Web",
    sections: [
      "What problem it solves",
      "Technical decisions",
      "How it looks",
      "Demo",
      "Other parts of FixFlow",
    ],
    images: 5,
    videos: 1,
    home: "/en/#fixflow",
  },
  {
    path: "/fixflow-mobile/",
    locale: "pl-PL",
    title: "FixFlow.Mobile",
    sections: [
      "Jaki problem rozwiązuje",
      "Decyzje techniczne",
      "Jak to wygląda",
      "Wersja demo",
      "Pozostałe części FixFlow",
    ],
    images: 8,
    videos: 1,
    home: "/#fixflow",
  },
  {
    path: "/en/fixflow-mobile/",
    locale: "en-US",
    title: "FixFlow.Mobile",
    sections: [
      "What problem it solves",
      "Technical decisions",
      "How it looks",
      "Demo",
      "Other parts of FixFlow",
    ],
    images: 8,
    videos: 1,
    home: "/en/#fixflow",
  },
] as const;

async function loadAllImages(page: Page): Promise<void> {
  for (const image of await page.locator("img").all()) {
    await image.scrollIntoViewIfNeeded();
  }
  await page.waitForLoadState("networkidle");
}

for (const project of projects) {
  test.describe(`project page ${project.path}`, () => {
    test("shows the title, the sections and the technical decisions", async ({ browser }) => {
      const context = await browser.newContext({ locale: project.locale });
      await mockApi(context);
      const page = await context.newPage();
      const errors = trackErrors(page);

      await page.goto(project.path);

      await expect(page).toHaveTitle(`${project.title} - Mateusz Palus`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(project.title);
      await expect(page.getByRole("heading", { level: 2 })).toHaveText([...project.sections]);
      expect(await page.getByRole("heading", { level: 3 }).count()).toBeGreaterThanOrEqual(3);
      await expect(page.locator("main video")).toHaveCount(project.videos * 2);
      await expect(page.locator("main figure:has(video) figcaption")).toHaveCount(project.videos);
      await expect(page.locator("main video[autoplay]:not([controls])")).toHaveCount(0);
      expect(errors).toEqual([]);
      await context.close();
    });

    test("labels each technical decision with its mechanism", async ({ browser }) => {
      const context = await browser.newContext({ locale: project.locale });
      await mockApi(context);
      const page = await context.newPage();
      await page.goto(project.path);

      const items = page.locator('section[aria-labelledby="decisions-heading"] ul > li');
      const count = await items.count();

      expect(count).toBeGreaterThanOrEqual(3);
      expect(count).toBeLessThanOrEqual(5);
      await expect(items.locator("h3")).toHaveCount(count);
      const tags = await items.locator("div > p.font-mono").allTextContents();
      expect(tags).toHaveLength(count);
      expect(tags.every((tag) => tag.trim() !== "")).toBe(true);
      expect(new Set(tags).size).toBe(count);
      await context.close();
    });

    test("loads every screenshot with known dimensions and alt text", async ({ browser }) => {
      const context = await browser.newContext({ locale: project.locale });
      await mockApi(context);
      const page = await context.newPage();
      const errors = trackErrors(page);
      await page.goto(project.path);

      await loadAllImages(page);
      const images = await page.locator("img").evaluateAll((elements: HTMLImageElement[]) =>
        elements.map((image) => ({
          src: image.currentSrc,
          alt: image.alt,
          width: Number(image.getAttribute("width")),
          naturalWidth: image.naturalWidth,
        })),
      );

      expect(images).toHaveLength(project.images);
      for (const image of images) {
        expect(image.naturalWidth).toBeGreaterThan(0);
        expect(image.src).toMatch(/\.(avif|webp)$/);
        expect(image.alt.length).toBeGreaterThan(20);
        expect(image.width).toBeGreaterThan(0);
      }
      expect(errors).toEqual([]);
      await context.close();
    });

    test("opens external links in a new tab and links back to all projects", async ({
      browser,
    }) => {
      const context = await browser.newContext({ locale: project.locale });
      await mockApi(context);
      const page = await context.newPage();
      await page.goto(project.path);

      const externalLinks = page.locator('main a[href^="https://"]');
      expect(await externalLinks.count()).toBeGreaterThanOrEqual(4);
      for (const link of await externalLinks.all()) {
        await expect(link).toHaveAttribute("target", "_blank");
        await expect(link).toHaveAttribute("rel", "noopener");
      }
      await page.getByRole("link", { name: /^(Wszystkie projekty|All projects)$/ }).click();

      await expect
        .poll(() => new URL(page.url()))
        .toMatchObject({
          pathname: project.home.split("#")[0],
          hash: "#fixflow",
        });
      await context.close();
    });

    test("links to the other parts of FixFlow in the same language", async ({ browser }) => {
      const others = projects.filter(
        (other) => other.locale === project.locale && other.path !== project.path,
      );
      const context = await browser.newContext({ locale: project.locale });
      await mockApi(context);
      const page = await context.newPage();
      await page.goto(project.path);

      const section = page.getByRole("region", {
        name: /^(Pozostałe części FixFlow|Other parts of FixFlow)$/,
      });
      const links = section.getByRole("link");
      await expect(links).toHaveCount(2);
      for (const [index, other] of others.entries()) {
        await expect(links.nth(index)).toHaveAttribute("href", other.path);
        await expect(links.nth(index)).toHaveText(other.title);
      }
      await links.first().click();

      await expect(page).toHaveURL(new RegExp(`${others[0]?.path ?? ""}$`));
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(others[0]?.title ?? "");
      await context.close();
    });

    test("maps the other parts of FixFlow in the opening section on wide screens", async ({
      browser,
    }) => {
      const others = projects.filter(
        (other) => other.locale === project.locale && other.path !== project.path,
      );
      const context = await browser.newContext({
        locale: project.locale,
        viewport: { width: 1440, height: 900 },
      });
      await mockApi(context);
      const page = await context.newPage();
      await page.goto(project.path);

      const map = page.locator("main > section:first-child svg[aria-labelledby]");
      await expect(map).toBeVisible();
      await expect(map.getByRole("link")).toHaveCount(2);
      for (const other of others) {
        await expect(
          map.getByRole("link", { name: new RegExp(`^${other.title.replace(".", "\\.")}`) }),
        ).toHaveAttribute("href", other.path);
      }
      await expect(map.locator("[aria-current='page']")).toContainText(project.title);

      await page.setViewportSize({ width: 360, height: 800 });
      await expect(map).toBeHidden();
      await context.close();
    });
  });
}

test("links the English panel demo with the English interface", async ({ browser }) => {
  const context = await browser.newContext({ locale: "en-US" });
  await mockApi(context);
  const page = await context.newPage();
  await page.goto("/en/fixflow-web/");

  const demoLinks = page.locator("main a[data-demo-link]");

  await expect(demoLinks).toHaveCount(2);
  for (const link of await demoLinks.all()) {
    await expect(link).toHaveAttribute("href", "https://fix-flow-web.vercel.app/?lang=en");
  }
  await context.close();
});

test("opens a project page from its card on the home page", async ({ browser }) => {
  const context = await browser.newContext({ locale: "pl-PL" });
  await mockApi(context);
  const page = await context.newPage();
  await page.goto("/");

  await page.getByRole("link", { name: "Szczegóły projektu FixFlow.Mobile" }).click();

  await expect(page).toHaveURL(/\/fixflow-mobile\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("FixFlow.Mobile");
  await context.close();
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`shows the right video variant with ${reducedMotion} motion`, async ({ browser }) => {
    const context = await browser.newContext({ locale: "pl-PL", reducedMotion });
    await mockApi(context);
    const page = await context.newPage();
    const videoRequests: string[] = [];
    page.on("request", (request) => {
      if (/\.(webm|mp4)$/.test(new URL(request.url()).pathname)) {
        videoRequests.push(request.url());
      }
    });
    await page.goto("/fixflow-web/");
    await page.waitForLoadState("networkidle");

    const autoplaying = page.locator("main video[autoplay]");
    const manual = page.locator("main video[controls]:not([autoplay])");

    if (reducedMotion === "reduce") {
      await expect(autoplaying).toBeHidden();
      await expect(manual).toBeVisible();
      expect(videoRequests).toEqual([]);
    } else {
      await expect(autoplaying).toBeVisible();
      await expect(autoplaying).toHaveAttribute("controls");
      await expect(manual).toBeHidden();
      expect(videoRequests.length).toBeGreaterThan(0);
    }
    await context.close();
  });
}

for (const { width, ratio } of [
  { width: 1440, ratio: 2 / 3 },
  { width: 360, ratio: 1 },
]) {
  test(`shows the single desktop screenshot of the mobile app at ${String(width)} px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      locale: "en-US",
      viewport: { width, height: 900 },
    });
    await mockApi(context);
    const page = await context.newPage();
    await page.goto("/en/fixflow-mobile/");

    const windows = page.locator("figure").filter({ hasText: "Windows version" });
    const gallery = page.locator("main ul").filter({ has: page.locator("video") });
    const windowsBox = await windows.boundingBox();
    const galleryBox = await gallery.boundingBox();

    expect((windowsBox?.width ?? 0) / (galleryBox?.width ?? 1)).toBeCloseTo(ratio, 1);
    await context.close();
  });
}
