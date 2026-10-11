import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import ProjectCard from "@/components/ProjectCard.astro";
import SystemDiagram from "@/components/SystemDiagram.astro";

const project: CollectionEntry<"projects"> = {
  id: "en/fixflow-web",
  collection: "projects",
  data: {
    project: "fixflow-web",
    order: 2,
    title: "FixFlow.Web",
    summary: "A dispatcher panel.",
    stack: ["React 19", "TypeScript 7"],
    decisions: [
      { title: "One", body: "First." },
      { title: "Two", body: "Second." },
      { title: "Three", body: "Third." },
    ],
    links: {
      repository: "https://github.com/mpalus-git/FixFlow.Web",
      demo: "https://fix-flow-web.vercel.app/?lang=en",
    },
    demo: "Quick sign-in buttons.",
  },
};

async function renderCard(entry: CollectionEntry<"projects">): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectCard, { props: { project: entry, language: "en" } });
}

describe("ProjectCard", () => {
  it("renders the title, summary and stack", async () => {
    const html = await renderCard(project);

    expect(html).toMatch(/<h3[^>]*>FixFlow\.Web<\/h3>/);
    expect(html).toContain("A dispatcher panel.");
    expect(html).toContain('aria-label="Main technologies"');
    expect(html).toContain("React 19");
    expect(html).toContain("TypeScript 7");
  });

  it("opens every link in a new tab with an accessible hint", async () => {
    const html = await renderCard(project);
    const links = html.match(/<a [^>]*>/g) ?? [];

    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener"');
    }
    expect(html.match(/\(opens in a new tab\)/g)).toHaveLength(2);
  });

  it("marks only the demo link as a demo link", async () => {
    const html = await renderCard(project);

    expect(html).toMatch(
      /<a href="https:\/\/fix-flow-web\.vercel\.app\/\?lang=en"[^>]*data-demo-link/,
    );
    expect(html).not.toMatch(/<a href="https:\/\/github\.com[^"]*"[^>]*data-demo-link/);
  });

  it("shows the release and documentation links when present", async () => {
    const html = await renderCard({
      ...project,
      data: {
        ...project.data,
        links: {
          repository: "https://github.com/mpalus-git/FixFlow.Mobile",
          release: "https://github.com/mpalus-git/FixFlow.Mobile/releases/latest",
          docs: "https://fixflow-api-us2p.onrender.com/scalar",
        },
      },
    });

    expect(html).toContain("Download the release");
    expect(html).toContain("API documentation");
    expect(html).not.toContain("Try the demo");
    expect(html).toMatch(
      /<a href="https:\/\/fixflow-api-us2p\.onrender\.com\/scalar"[^>]*data-demo-link/,
    );
  });
});

describe("SystemDiagram", () => {
  it.each([
    ["pl", "Architektura systemu FixFlow", "Panel dyspozytora"],
    ["en", "FixFlow system architecture", "Dispatcher panel"],
  ] as const)("is an accessible image in %s", async (language, title, role) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SystemDiagram, { props: { language } });

    expect(html).toContain('role="img"');
    expect(html).toContain('aria-labelledby="system-diagram-title system-diagram-description"');
    expect(html).toContain(`<title id="system-diagram-title">${title}</title>`);
    expect(html).toMatch(/<desc id="system-diagram-description">[^<]+<\/desc>/);
    expect(html).toContain(role);
  });
});
