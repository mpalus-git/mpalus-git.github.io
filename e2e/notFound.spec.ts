import { expect, test } from "@playwright/test";
import { newPageContext, trackErrors } from "./support";

const notFoundPages = [
  { path: "/404.html", label: /^Szczegóły projektu /, prefix: "" },
  { path: "/en/404/", label: / project details$/, prefix: "/en" },
] as const;

for (const { path, label, prefix } of notFoundPages) {
  test(`lists the three FixFlow projects on ${path}`, async ({ browser }) => {
    const context = await newPageContext(browser, path);
    const page = await context.newPage();
    const errors = trackErrors(page);
    await page.goto(path);

    await expect(page.getByRole("heading", { level: 2, name: "FixFlow" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 3 })).toHaveText([
      "FixFlow.Api",
      "FixFlow.Web",
      "FixFlow.Mobile",
    ]);
    const links = page.getByRole("link", { name: label });
    await expect(links).toHaveCount(3);
    for (const [index, project] of ["fixflow-api", "fixflow-web", "fixflow-mobile"].entries()) {
      await expect(links.nth(index)).toHaveAttribute("href", `${prefix}/${project}/`);
      const response = await page.request.get(`${prefix}/${project}/`);
      expect(response.status()).toBe(200);
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}
