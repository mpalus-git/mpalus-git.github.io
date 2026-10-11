import { expect, test } from "@playwright/test";
import { apiReadyUrl } from "../src/config";
import { mockApi, trackErrors } from "./support";

for (const [path, locale] of [
  ["/", "pl-PL"],
  ["/en/", "en-US"],
  ["/404.html", "pl-PL"],
  ["/en/404/", "en-US"],
] as const) {
  test(`wakes the API once on ${path} with an opaque cookie-less request`, async ({ browser }) => {
    const context = await browser.newContext({ locale });
    const requests = await mockApi(context);
    await context.addInitScript(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        document.documentElement.setAttribute("data-wake-init", JSON.stringify(init));
        return originalFetch(input, init);
      };
    });
    const page = await context.newPage();
    const errors = trackErrors(page);

    await page.goto(path);
    await page.waitForLoadState("networkidle");

    expect(requests).toHaveLength(1);
    const [request] = requests;
    expect(request?.url()).toBe(apiReadyUrl);
    expect(request?.method()).toBe("GET");
    expect(await request?.headerValue("cookie")).toBeNull();
    await expect(page.locator("html")).toHaveAttribute(
      "data-wake-init",
      JSON.stringify({ mode: "no-cors", credentials: "omit", cache: "no-store", keepalive: true }),
    );
    expect(errors).toEqual([]);
    await context.close();
  });
}

test("does not wake again during internal navigation within five minutes", async ({ browser }) => {
  const context = await browser.newContext({ locale: "pl-PL" });
  const requests = await mockApi(context);
  const page = await context.newPage();
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  await page.getByRole("link", { name: "English" }).click();
  await page.waitForLoadState("networkidle");

  expect(new URL(page.url()).pathname).toBe("/en/");
  expect(requests).toHaveLength(1);
  await context.close();
});

test("stays silent when the API responds with an error", async ({ browser }) => {
  const context = await browser.newContext({ locale: "pl-PL" });
  const requests = await mockApi(context, (route) =>
    route.fulfill({ status: 503, contentType: "text/html", body: "<h1>Service Unavailable</h1>" }),
  );
  const page = await context.newPage();
  const errors = trackErrors(page);

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect(requests).toHaveLength(1);
  expect(errors.filter((error) => !error.startsWith("Failed to load resource"))).toEqual([]);
  await context.close();
});

test("does not raise page errors when the request is blocked", async ({ browser }) => {
  const context = await browser.newContext({ locale: "pl-PL" });
  await mockApi(context, (route) => route.abort("blockedbyclient"));
  const page = await context.newPage();
  const errors = trackErrors(page);

  await page.goto("/");
  await page.waitForLoadState("networkidle");

  expect(errors.filter((error) => !error.includes("net::ERR_BLOCKED_BY_CLIENT"))).toEqual([]);
  await context.close();
});
