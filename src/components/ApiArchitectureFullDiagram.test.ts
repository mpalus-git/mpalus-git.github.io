import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ApiArchitectureFullDiagram from "@/components/ApiArchitectureFullDiagram.astro";

async function render(language: "pl" | "en", layout: "wide" | "narrow" = "wide"): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ApiArchitectureFullDiagram, { props: { language, layout } });
}

describe("ApiArchitectureFullDiagram", () => {
  it.each([
    ["pl", "Architektura FixFlow.Api"],
    ["en", "FixFlow.Api architecture"],
  ] as const)("is an accessible image in %s in both layouts", async (language, title) => {
    for (const layout of ["wide", "narrow"] as const) {
      const html = await render(language, layout);
      const id = `api-architecture-${layout}`;

      expect(html).toContain('role="img"');
      expect(html).toContain(`aria-labelledby="${id}-title ${id}-description"`);
      expect(html).toContain(`<title id="${id}-title">${title}</title>`);
      expect(html).toMatch(new RegExp(`<desc id="${id}-description">[^<]+Redis[^<]+</desc>`));
      expect(html).toContain(`marker-end="url(#${id}-arrow)"`);
    }
  });

  it("shows the clients, the blocks with details and the external services", async () => {
    const html = await render("en");

    for (const text of [
      "Dispatcher panel",
      "Technician app",
      "validation, authorization",
      "Feature handlers (vertical slices)",
      "entities and rules",
      "L1 in memory",
      "Redis 8.4",
      "L2, optional",
      "PostgreSQL 18",
      "Mailpit locally",
    ]) {
      expect(html).toContain(text);
    }
  });

  it("shows the same blocks in the narrow layout", async () => {
    const wide = await render("en", "wide");
    const narrow = await render("en", "narrow");
    const texts = (html: string) =>
      [...html.matchAll(/<text[^>]*>\s*([^<]+?)\s*<\/text>/g)].map((match) => match[1]).sort();

    expect(texts(narrow)).toEqual(
      [...texts(wide), "authorization", "validation,"]
        .filter((text) => text !== "validation, authorization")
        .sort(),
    );
  });

  it("splits the job list into separate lines", async () => {
    const html = await render("pl");

    expect(html).toMatch(/>\s*opóźnienia,\s*<\/text>/);
    expect(html).toMatch(/>\s*podsumowanie,\s*<\/text>/);
    expect(html).toMatch(/>\s*sprzątanie tokenów\s*<\/text>/);
  });
});
