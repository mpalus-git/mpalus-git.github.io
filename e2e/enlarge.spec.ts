import { expect, test } from "@playwright/test";
import { newPageContext, trackErrors } from "./support";

const galleries = [
  { path: "/fixflow-web/", label: /^Powiększ: /, count: 5 },
  { path: "/en/fixflow-mobile/", label: /^Enlarge: /, count: 8 },
];

for (const { path, label, count } of galleries) {
  test(`links every screenshot on ${path} to its full-size image`, async ({ browser }) => {
    const context = await newPageContext(browser, path);
    const page = await context.newPage();
    const errors = trackErrors(page);
    await page.goto(path);

    const links = page.getByRole("link", { name: label });
    await expect(links).toHaveCount(count);
    const sizes = await links.evaluateAll(async (elements) =>
      Promise.all(
        elements.map(async (element) => {
          const thumbnail = element.querySelector("img");
          const full = new Image();
          full.src = element.getAttribute("href") ?? "";
          await full.decode();
          return {
            href: element.getAttribute("href"),
            target: element.getAttribute("target"),
            alt: thumbnail?.alt ?? "",
            label: element.getAttribute("aria-label"),
            expected: Number(thumbnail?.getAttribute("width")),
            width: full.naturalWidth,
          };
        }),
      ),
    );

    const captions = await page
      .locator("figure")
      .filter({ has: links })
      .locator("figcaption")
      .allTextContents();
    expect(captions).toHaveLength(count);
    expect(captions.every((caption) => caption.trim() !== "")).toBe(true);
    for (const size of sizes) {
      expect(size.href).toMatch(/^\/_astro\/[^/]+\.webp$/);
      expect(size.target).toBeNull();
      expect(size.label).toBe(`${path.startsWith("/en/") ? "Enlarge" : "Powiększ"}: ${size.alt}`);
      expect(size.width).toBe(size.expected);
      expect(size.width).toBeGreaterThanOrEqual(540);
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}

test("opens a screenshot in the same tab and returns with Back", async ({ browser }) => {
  const context = await newPageContext(browser, "/fixflow-web/");
  const page = await context.newPage();
  await page.goto("/fixflow-web/");

  const link = page.getByRole("link", { name: /^Powiększ: Tablica dispatch/ });
  const response = page.waitForResponse((candidate) => candidate.url().endsWith(".webp"));
  await link.click();
  expect((await response).headers()["content-type"]).toBe("image/webp");
  await expect(page).toHaveURL(/\/_astro\/dispatch\.[^/]+\.webp$/);
  expect(context.pages()).toHaveLength(1);

  await page.goBack();
  await expect(page).toHaveURL(/\/fixflow-web\/$/);
  await context.close();
});

test("shows an unclipped focus ring around a focused screenshot", async ({ browser }) => {
  const context = await newPageContext(browser, "/en/fixflow-mobile/", {
    viewport: { width: 360, height: 780 },
  });
  const page = await context.newPage();
  await page.goto("/en/fixflow-mobile/");

  const link = page.getByRole("link", { name: /^Enlarge: / }).first();
  await link.scrollIntoViewIfNeeded();
  await page.keyboard.press("Tab");
  await link.focus();
  const ring = await link.evaluate((element) => {
    const style = getComputedStyle(element);
    const clipping = [];
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (getComputedStyle(parent).overflow !== "visible") {
        clipping.push(parent.tagName);
      }
    }
    return {
      focusVisible: element.matches(":focus-visible"),
      outline: `${style.outlineStyle} ${style.outlineWidth}`,
      clipping,
    };
  });

  expect(ring.focusVisible).toBe(true);
  expect(ring.outline).toBe("solid 3px");
  expect(ring.clipping.filter((tag) => tag !== "HTML" && tag !== "BODY")).toEqual([]);
  await context.close();
});
