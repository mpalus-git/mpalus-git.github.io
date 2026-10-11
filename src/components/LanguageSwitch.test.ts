import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import LanguageSwitch from "@/components/LanguageSwitch.astro";

async function render(language: "pl" | "en", path: string): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(LanguageSwitch, { props: { language, path } });
}

describe("LanguageSwitch", () => {
  it("marks the current language and links to the English counterpart", async () => {
    const html = await render("pl", "/");

    expect(html).toContain('aria-label="Wybór języka"');
    expect(html).toMatch(/<span aria-current="page"[^>]*><span aria-hidden="true">PL<\/span>/);
    expect(html).toMatch(/<a href="\/en\/" hreflang="en" lang="en" data-language-switch="en"/);
    expect(html).toContain('<span class="sr-only">English</span>');
    expect(html).toContain('<span class="sr-only">Polski</span>');
  });

  it("links from an English page to the Polish counterpart", async () => {
    const html = await render("en", "/en/");

    expect(html).toContain('aria-label="Language"');
    expect(html).toMatch(/<span aria-current="page"[^>]*><span aria-hidden="true">EN<\/span>/);
    expect(html).toMatch(/<a href="\/" hreflang="pl" lang="pl"/);
  });

  it("links between the 404 pages", async () => {
    expect(await render("pl", "/404/")).toMatch(/<a href="\/en\/404\/" hreflang="en"/);
    expect(await render("en", "/en/404/")).toMatch(/<a href="\/404\.html" hreflang="pl"/);
  });

  it("renders exactly one link and one current item", async () => {
    const html = await render("pl", "/");

    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
  });
});
