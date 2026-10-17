import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import TechList from "@/components/TechList.astro";

async function renderTechList(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TechList, { props });
}

describe("TechList", () => {
  const props = { technologies: ["React 19", "TypeScript 7"], label: "Main technologies" };

  it("lists every technology under an accessible label", async () => {
    const html = await renderTechList(props);

    expect(html).toContain('aria-label="Main technologies"');
    expect(html.match(/<li[^>]*>\s*React 19\s*<\/li>/g)).toHaveLength(1);
    expect(html.match(/<li[^>]*>\s*TypeScript 7\s*<\/li>/g)).toHaveLength(1);
  });

  it("uses the monospace font with separators hidden from screen readers", async () => {
    const html = await renderTechList(props);

    expect(html).toMatch(/<ul[^>]*class="[^"]*font-mono/);
    expect(html).toContain("before:content-['·'_/_'']");
    expect(html).not.toContain("rounded-full");
  });

  it("adds the caller's classes", async () => {
    const html = await renderTechList({ ...props, class: "mt-4 text-muted" });

    expect(html).toMatch(/<ul[^>]*class="[^"]*mt-4 text-muted/);
  });
});
