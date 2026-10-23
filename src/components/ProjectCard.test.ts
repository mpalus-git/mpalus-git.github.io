import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import dispatchCover from "@/assets/projects/fixflow-web/dispatch-cover.png";
import dashboard from "@/assets/projects/fixflow-web/dashboard.png";
import ProjectCard from "@/components/ProjectCard.astro";

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
    architectureDiagram: false,
    screenshots: [],
  },
};

async function renderCard(entry: CollectionEntry<"projects">): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectCard, { props: { project: entry, language: "en" } });
}

describe("ProjectCard", () => {
  it("renders the title, summary and stack", async () => {
    const html = await renderCard(project);

    expect(html).toMatch(/<h3[^>]*>\s*<a[^>]*>\s*FixFlow\.Web/);
    expect(html).toContain("A dispatcher panel.");
    expect(html).toContain('aria-label="Main technologies"');
    expect(html).toContain("React 19");
    expect(html).toContain("TypeScript 7");
  });

  it("shows only the first four technologies of the stack", async () => {
    const html = await renderCard({
      ...project,
      data: { ...project.data, stack: ["One", "Two", "Three", "Four", "Five", "Six"] },
    });

    expect(html).toContain("Four");
    expect(html).not.toContain("Five");
    expect(html).not.toContain("Six");
  });

  it("links the title to the project page in the same language", async () => {
    const html = await renderCard(project);

    expect(html).toMatch(
      /<h3[^>]*>\s*<a href="\/en\/fixflow-web\/" aria-label="FixFlow\.Web project details"/,
    );
  });

  it("opens every external link in a new tab with an accessible hint", async () => {
    const html = await renderCard(project);
    const links = html.match(/<a href="https:[^>]*>/g) ?? [];

    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toContain('target="_blank"');
      expect(link).toContain('rel="noopener"');
    }
    expect(html.match(/\(opens in a\snew tab\)/g)).toHaveLength(2);
  });

  it("names the project in every external link for screen readers", async () => {
    const html = await renderCard(project);

    expect(html).toMatch(/Try the demo\s*<span class="sr-only">FixFlow\.Web<\/span>/);
    expect(html).toMatch(/Repository\s*<span class="sr-only">FixFlow\.Web<\/span>/);
    expect(html.match(/<span class="sr-only">FixFlow\.Web<\/span>/g)).toHaveLength(2);
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

describe("ProjectCard cover", () => {
  it("shows the API architecture diagram when the project has one", async () => {
    const html = await renderCard({
      ...project,
      id: "en/fixflow-api",
      data: {
        ...project.data,
        project: "fixflow-api",
        title: "FixFlow.Api",
        architectureDiagram: true,
      },
    });

    expect(html).toContain('aria-labelledby="api-diagram-title api-diagram-description"');
    expect(html).toContain('<title id="api-diagram-title">FixFlow.Api architecture</title>');
    expect(html).toContain("Feature handlers (vertical slices)");
    expect(html).toContain("which use the domain, HybridCache and PostgreSQL.</desc>");
    expect(html).not.toContain("SMTP");
  });

  it("prefers the cover image over the first screenshot", async () => {
    const html = await renderCard({
      ...project,
      data: {
        ...project.data,
        cover: { image: dispatchCover, alt: "Part of the dispatch board" },
        screenshots: [
          { image: dashboard, alt: "Dashboard", caption: "Dashboard", device: "desktop" },
        ],
      },
    });

    expect(html).toContain('alt="Part of the dispatch board"');
    expect(html).not.toContain('alt="Dashboard"');
  });

  it("shows no cover image without screenshots", async () => {
    const html = await renderCard(project);

    expect(html).not.toContain("<img");
    expect(html).not.toContain("<svg role");
  });
});
