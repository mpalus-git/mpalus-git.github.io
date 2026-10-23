import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import TechList from "@/components/TechList.astro";

async function renderTechList(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(TechList, { props });
}

describe("TechList", () => {
  const props = {
    technologies: ["React 19", "TypeScript 7"],
    label: "Main technologies",
    tone: "surface",
  };

  it("lists every technology under an accessible label", async () => {
    const html = await renderTechList(props);

    expect(html).toContain('aria-label="Main technologies"');
    expect(html.match(/<li[^>]*>\s*React 19\s*<\/li>/g)).toHaveLength(1);
    expect(html.match(/<li[^>]*>\s*TypeScript 7\s*<\/li>/g)).toHaveLength(1);
  });

  it("renders each technology as a bordered label without separators", async () => {
    const html = await renderTechList(props);

    expect(html.match(/<li class="[^"]*rounded-md border[^"]*border-border bg-bg/g)).toHaveLength(
      2,
    );
    expect(html).not.toContain("font-mono");
    expect(html).not.toContain("before:content");
  });

  it("uses light borders and text on the brand background", async () => {
    const html = await renderTechList({ ...props, tone: "brand" });

    expect(html.match(/<li class="[^"]*border-on-brand\/55 text-on-brand/g)).toHaveLength(2);
    expect(html).not.toContain("border-border");
  });

  it("adds the caller's classes", async () => {
    const html = await renderTechList({ ...props, class: "mt-4" });

    expect(html).toMatch(/<ul[^>]*class="[^"]*mt-4/);
  });
});
