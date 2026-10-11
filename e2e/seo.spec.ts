import { expect, test } from "@playwright/test";
import { mockApi, trackErrors } from "./support";

const site = "https://mpalus-git.github.io";

const pages = [
  "/",
  "/en/",
  "/fixflow-api/",
  "/fixflow-web/",
  "/fixflow-mobile/",
  "/en/fixflow-api/",
  "/en/fixflow-web/",
  "/en/fixflow-mobile/",
  "/404.html",
  "/en/404/",
];

test("every page in a language has its own title, description and canonical address", async ({
  browser,
}) => {
  const context = await browser.newContext({ locale: "pl-PL" });
  await mockApi(context);
  const page = await context.newPage();
  const titles = new Set<string>();
  const descriptions = new Set<string>();

  for (const path of pages) {
    await page.goto(path);
    const language = (await page.locator("html").getAttribute("lang")) ?? "";
    const description =
      (await page.locator('meta[name="description"]').getAttribute("content")) ?? "";
    expect(description).not.toBe("");
    titles.add(`${language} ${await page.title()}`);
    descriptions.add(`${language} ${description}`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${site}${path}`);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      "content",
      `${site}${path}`,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(path.includes("404") ? 1 : 0);
  }

  expect(titles.size).toBe(pages.length);
  expect(descriptions.size).toBe(pages.length);
  await context.close();
});

test("the link preview image and the favicon are served", async ({ request }) => {
  const image = await request.get("/og-image.png");
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toBe("image/png");
  const size = (await image.body()).subarray(16, 24);
  expect([size.readUInt32BE(0), size.readUInt32BE(4)]).toEqual([1200, 630]);

  const favicon = await request.get("/favicon.svg");
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()["content-type"]).toContain("image/svg+xml");
});

for (const [path, url] of [
  ["/", `${site}/`],
  ["/en/", `${site}/en/`],
] as const) {
  test(`the home page ${path} describes its author as a person`, async ({ browser }) => {
    const context = await browser.newContext({ locale: path === "/" ? "pl-PL" : "en-US" });
    await mockApi(context);
    const page = await context.newPage();
    const errors = trackErrors(page);
    await page.goto(path);

    const data: unknown = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? "",
    );

    expect(data).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Mateusz Palus",
      url,
      jobTitle: "Full-stack Developer (.NET, Web)",
      sameAs: ["https://github.com/mpalus-git"],
    });
    expect(errors).toEqual([]);
    await context.close();
  });
}

test("robots.txt points to a sitemap with both language versions of every page", async ({
  request,
}) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${site}/sitemap-index.xml`);

  const index = await (await request.get("/sitemap-index.xml")).text();
  expect(index).toContain(`<loc>${site}/sitemap-0.xml</loc>`);

  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  expect(locations.sort()).toEqual(
    pages
      .filter((path) => !path.includes("404"))
      .map((path) => `${site}${path}`)
      .sort(),
  );
  for (const path of ["/", "/fixflow-mobile/"]) {
    expect(sitemap).toContain(
      `<xhtml:link rel="alternate" hreflang="en" href="${site}/en${path}"/>`,
    );
    expect(sitemap).toContain(`<xhtml:link rel="alternate" hreflang="pl" href="${site}${path}"/>`);
  }
});
