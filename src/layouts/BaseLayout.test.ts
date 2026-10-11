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
    ["pl", "/fixflow-web/", "pl_PL", "en_US"],
    ["en", "/en/fixflow-web/", "en_US", "pl_PL"],
  ] as const)(
    "describes the %s page %s for link previews",
    async (language, path, locale, other) => {
      const html = await render(language, path);

      expect(html).toContain('<meta property="og:title" content="Tytuł">');
      expect(html).toContain('<meta property="og:description" content="Opis strony">');
      expect(html).toContain(`<meta property="og:url" content="${site}${path}">`);
      expect(html).toContain(`<meta property="og:locale" content="${locale}">`);
      expect(html).toContain(`<meta property="og:locale:alternate" content="${other}">`);
      expect(html).toContain(`<meta property="og:image" content="${site}/og-image.png">`);
      expect(html).toMatch(/<meta property="og:image:alt" content="Mateusz Palus, [^"]+">/);
      expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
      expect(html).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml">');
    },
  );

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
