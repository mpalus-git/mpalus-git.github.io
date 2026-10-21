import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import SystemDiagram from "@/components/SystemDiagram.astro";
import type { Language } from "@/i18n/i18n";

async function renderDiagram(
  language: Language,
  current?: "fixflow-api" | "fixflow-web" | "fixflow-mobile",
) {
  const container = await AstroContainer.create();
  return container.renderToString(SystemDiagram, {
    props: current === undefined ? { language } : { language, current },
  });
}

describe("SystemDiagram", () => {
  it.each([
    ["pl", "Architektura systemu FixFlow", "Panel dyspozytora"],
    ["en", "FixFlow system architecture", "Dispatcher panel"],
  ] as const)("is an accessible image in %s", async (language, title, role) => {
    const html = await renderDiagram(language);

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-labelledby="system-diagram-title system-diagram-description"');
    expect(html).toContain(`<title id="system-diagram-title">${title}</title>`);
    expect(html).toMatch(/<desc id="system-diagram-description">[^<]+<\/desc>/);
    expect(html).toContain(role);
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("aria-current");
  });

  it.each([
    ["pl", "fixflow-web", ["/fixflow-mobile/", "/fixflow-api/"]],
    ["en", "fixflow-api", ["/en/fixflow-web/", "/en/fixflow-mobile/"]],
  ] as const)(
    "links the other parts in %s when %s is current",
    async (language, current, links) => {
      const html = await renderDiagram(language, current);
      const hrefs = [...html.matchAll(/<a href="([^"]+)"/g)].map((match) => match[1]);

      expect(html).not.toContain('role="img"');
      expect(html).toContain('aria-labelledby="system-diagram-title system-diagram-description"');
      expect(hrefs).toEqual(links);
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    },
  );
});
