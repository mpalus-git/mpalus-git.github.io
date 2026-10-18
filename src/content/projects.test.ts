import { describe, expect, it } from "vitest";
import { languages } from "@/i18n/i18n";

type Media = { image?: string; poster?: string; file?: string; alt: string; device: string };

type ProjectFrontmatter = {
  project: string;
  order: number;
  stack: string[];
  links: Record<string, string>;
  screenshots?: Media[];
  video?: Media;
};

const files = import.meta.glob<{ frontmatter: ProjectFrontmatter }>(
  "/src/content/projects/*/*.md",
  { eager: true },
);
const sources = import.meta.glob<string>("/src/content/projects/*/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function entriesFor(language: string) {
  const prefix = `/src/content/projects/${language}/`;
  return new Map(
    Object.entries(files)
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, module]) => [path.slice(prefix.length, -".md".length), module.frontmatter]),
  );
}

const polish = entriesFor("pl");
const english = entriesFor("en");

describe("project content", () => {
  it("has all three projects in every language", () => {
    for (const language of languages) {
      expect([...entriesFor(language).keys()].sort()).toEqual([
        "fixflow-api",
        "fixflow-mobile",
        "fixflow-web",
      ]);
    }
  });

  it("lists at least four technologies for the project card", () => {
    for (const entries of [polish, english]) {
      for (const frontmatter of entries.values()) {
        expect(frontmatter.stack.length).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it("names each file after its project", () => {
    for (const entries of [polish, english]) {
      for (const [name, frontmatter] of entries) {
        expect(frontmatter.project).toBe(name);
      }
    }
  });

  it("keeps the order, stack and links the same in both languages", () => {
    for (const [name, pl] of polish) {
      const en = english.get(name);
      expect(en?.order).toBe(pl.order);
      expect(en?.stack).toEqual(pl.stack);
      const { demo: polishDemo, ...polishLinks } = pl.links;
      const { demo: englishDemo, ...englishLinks } = en?.links ?? {};
      expect(englishLinks).toEqual(polishLinks);
      expect(englishDemo).toBe(polishDemo === undefined ? undefined : `${polishDemo}/?lang=en`);
    }
  });

  it("uses the same screenshots and video in both languages", () => {
    for (const [name, pl] of polish) {
      const en = english.get(name);
      const files = (project?: ProjectFrontmatter) =>
        [...(project?.screenshots ?? []), ...(project?.video ? [project.video] : [])].map(
          (media) => [media.image, media.file, media.poster, media.device],
        );
      expect(files(en)).toEqual(files(pl));
    }
  });

  it("describes every screenshot and video in both languages", () => {
    for (const [name, pl] of polish) {
      const en = english.get(name);
      const alts = (project?: ProjectFrontmatter) =>
        [...(project?.screenshots ?? []), ...(project?.video ? [project.video] : [])].map(
          (media) => media.alt,
        );
      const polishAlts = alts(pl);
      const englishAlts = alts(en);
      expect(englishAlts).toHaveLength(polishAlts.length);
      for (const [index, alt] of polishAlts.entries()) {
        expect(alt.trim()).not.toBe("");
        expect(englishAlts[index]?.trim()).not.toBe("");
        expect(englishAlts[index]).not.toBe(alt);
      }
      for (const alt of [...polishAlts, ...englishAlts]) {
        expect(alt).not.toMatch(/zrzut ekranu|screenshot/i);
      }
    }
  });

  it("shows screenshots for the web panel and the mobile app", () => {
    expect(polish.get("fixflow-web")?.screenshots?.[0]?.device).toBe("desktop");
    expect(polish.get("fixflow-mobile")?.screenshots?.[0]?.device).toBe("phone");
  });

  it("uses unique orders", () => {
    expect(new Set([...polish.values()].map((project) => project.order)).size).toBe(polish.size);
  });

  it("contains no demo account credentials", () => {
    for (const source of Object.values(sources)) {
      expect(source).not.toMatch(/@fixflow\.local|password|hasło:/i);
    }
  });
});
