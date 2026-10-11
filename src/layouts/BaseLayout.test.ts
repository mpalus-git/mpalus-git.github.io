import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import BaseLayout from "@/layouts/BaseLayout.astro";

const site = "https://mpalus-git.github.io";

async function render(language: "pl" | "en", path: string, noIndex = false): Promise<string> {
  const container = await AstroContainer.create({ astroConfig: { site } });
  return container.renderToString(BaseLayout, {
    props: { language, title: "Tytuł", description: "Opis strony", noIndex },
    request: new Request(new URL(path, site)),
  });
}

describe("BaseLayout", () => {
  it("renders the description and theme color", async () => {
    const html = await render("pl", "/");

    expect(html).toContain('<meta name="description" content="Opis strony">');
    expect(html).toContain('<meta name="theme-color" content="#0D736A">');
    expect(html).not.toContain('name="robots"');
  });

  it.each([
    ["pl", "/", `${site}/`],
    ["en", "/en/", `${site}/en/`],
    ["pl", "/fixflow-web/", `${site}/fixflow-web/`],
    ["en", "/en/fixflow-web/", `${site}/en/fixflow-web/`],
    ["pl", "/404.html", `${site}/404.html`],
    ["en", "/en/404/", `${site}/en/404/`],
  ] as const)("points the %s page %s to its canonical address", async (language, path, href) => {
    expect(await render(language, path)).toContain(`<link rel="canonical" href="${href}">`);
  });

  it("links both language versions with x-default pointing to Polish", async () => {
    const html = await render("en", "/en/fixflow-api/");

    expect(html).toContain(`<link rel="alternate" hreflang="pl" href="${site}/fixflow-api/">`);
    expect(html).toContain(`<link rel="alternate" hreflang="en" href="${site}/en/fixflow-api/">`);
    expect(html).toContain(
      `<link rel="alternate" hreflang="x-default" href="${site}/fixflow-api/">`,
    );
  });

  it("keeps pages out of the index only on request", async () => {
    expect(await render("en", "/en/404/", true)).toContain(
      '<meta name="robots" content="noindex">',
    );
  });
});
