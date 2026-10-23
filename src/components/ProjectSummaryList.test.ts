import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import ProjectSummaryList from "@/components/ProjectSummaryList.astro";

function entry(project: "fixflow-api" | "fixflow-web", title: string): CollectionEntry<"projects"> {
  return {
    id: `pl/${project}`,
    collection: "projects",
    data: {
      project,
      order: 1,
      title,
      summary: `${title} summary.`,
      stack: ["Astro"],
      decisions: [
        { title: "One", body: "First." },
        { title: "Two", body: "Second." },
        { title: "Three", body: "Third." },
      ],
      links: { repository: "https://github.com/mpalus-git/FixFlow.Web" },
      demo: "Demo.",
      architectureDiagram: false,
      screenshots: [],
    },
  };
}

async function render(props: Record<string, unknown>): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectSummaryList, { props });
}

describe("ProjectSummaryList", () => {
  const projects = [entry("fixflow-api", "FixFlow.Api"), entry("fixflow-web", "FixFlow.Web")];

  it("links every project to its page with its summary", async () => {
    const html = await render({ projects, language: "pl", class: "md:grid-cols-2" });

    expect(html).toMatch(/<ul class="mt-8 grid gap-6 md:grid-cols-2"/);
    expect(html.match(/<li/g)).toHaveLength(2);
    expect(html).toContain('href="/fixflow-api/"');
    expect(html).toContain('href="/fixflow-web/"');
    expect(html).toContain('aria-label="Szczegóły projektu FixFlow.Api"');
    expect(html).toContain("FixFlow.Web summary.");
  });

  it("links to the English pages in English", async () => {
    const html = await render({ projects, language: "en" });

    expect(html).toContain('href="/en/fixflow-api/"');
    expect(html).toContain('aria-label="FixFlow.Api project details"');
  });
});
