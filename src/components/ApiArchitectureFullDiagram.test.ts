import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import ApiArchitectureFullDiagram from "@/components/ApiArchitectureFullDiagram.astro";

async function render(language: "pl" | "en"): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ApiArchitectureFullDiagram, { props: { language } });
}

describe("ApiArchitectureFullDiagram", () => {
  it.each([
    ["pl", "Architektura FixFlow.Api"],
    ["en", "FixFlow.Api architecture"],
  ] as const)("is an accessible image in %s", async (language, title) => {
    const html = await render(language);

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-labelledby="api-architecture-title api-architecture-description"');
    expect(html).toContain(`<title id="api-architecture-title">${title}</title>`);
    expect(html).toMatch(/<desc id="api-architecture-description">[^<]+Redis[^<]+<\/desc>/);
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

  it("splits the job list into separate lines", async () => {
    const html = await render("pl");

    expect(html).toMatch(/>\s*opóźnienia,\s*<\/text>/);
    expect(html).toMatch(/>\s*podsumowanie,\s*<\/text>/);
    expect(html).toMatch(/>\s*sprzątanie tokenów\s*<\/text>/);
  });
});
