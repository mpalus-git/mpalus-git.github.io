import type { ImageMetadata } from "astro";
import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { selectProjects } from "@/content/projects";
import { languages } from "@/i18n/i18n";

type Media = {
  image?: string;
  thumbnail?: string;
  poster?: string;
  file?: string;
  alt: string;
  caption?: string;
  device: string;
};

type ProjectFrontmatter = {
  project: string;
  order: number;
  stack: string[];
  decisions: { title: string; body: string }[];
  links: Record<string, string>;
  architectureDiagram?: boolean;
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

const videoFiles = Object.keys(import.meta.glob("/src/assets/projects/*/*.{mp4,webm}"));
const images = import.meta.glob<ImageMetadata>("/src/assets/projects/*/*.png", {
  eager: true,
  import: "default",
});

function imageAt(path: string): ImageMetadata | undefined {
  return images[path.replace("../../../", "/src/")];
}

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

  it("keeps the order, stack, links and diagram the same in both languages", () => {
    for (const [name, pl] of polish) {
      const en = english.get(name);
      expect(en?.order).toBe(pl.order);
      expect(en?.stack).toEqual(pl.stack);
      expect(en?.architectureDiagram).toBe(pl.architectureDiagram);
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
          (media) => [media.image, media.thumbnail, media.file, media.poster, media.device],
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

  it("has WebM and MP4 files for every video", () => {
    const videos = [...polish, ...english].flatMap(([name, frontmatter]) =>
      frontmatter.video?.file ? [`/src/assets/projects/${name}/${frontmatter.video.file}`] : [],
    );

    expect(videos.length).toBeGreaterThan(0);
    for (const video of videos) {
      expect(videoFiles).toContain(`${video}.webm`);
      expect(videoFiles).toContain(`${video}.mp4`);
    }
  });

  it("gives every screenshot and video a short caption in both languages", () => {
    const media = (project?: ProjectFrontmatter) =>
      [...(project?.screenshots ?? []), ...(project?.video ? [project.video] : [])].map(
        (item) => item.caption ?? "",
      );
    for (const [name, pl] of polish) {
      const polishCaptions = media(pl);
      const englishCaptions = media(english.get(name));
      expect(englishCaptions).toHaveLength(polishCaptions.length);
      for (const [index, caption] of polishCaptions.entries()) {
        expect(englishCaptions[index]).not.toBe(caption);
      }
      for (const caption of [...polishCaptions, ...englishCaptions]) {
        expect(caption.split(" ").length).toBeGreaterThanOrEqual(2);
        expect(caption.split(" ").length).toBeLessThanOrEqual(6);
      }
    }
  });

  it("crops every thumbnail to 16:10 at a smaller size than its screenshot", () => {
    const screenshots = [...polish.values()].flatMap((project) => project.screenshots ?? []);
    const cropped = screenshots.filter((screenshot) => screenshot.thumbnail !== undefined);

    expect(cropped.length).toBeGreaterThan(0);
    for (const { image, thumbnail } of cropped) {
      const full = imageAt(image ?? "");
      const crop = imageAt(thumbnail ?? "");
      expect(crop?.width).toBeLessThan(full?.width ?? 0);
      expect((crop?.width ?? 0) * 10).toBe((crop?.height ?? 0) * 16);
    }
  });

  it("shows the architecture diagram only for the API", () => {
    expect(polish.get("fixflow-api")?.architectureDiagram).toBe(true);
    expect(polish.get("fixflow-web")?.architectureDiagram).toBeUndefined();
    expect(polish.get("fixflow-mobile")?.architectureDiagram).toBeUndefined();
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

function entry(id: string, order: number): CollectionEntry<"projects"> {
  return {
    id,
    collection: "projects",
    data: {
      project: "fixflow-web",
      order,
      title: id,
      summary: "Summary.",
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

describe("selectProjects", () => {
  const entries = [
    entry("en/web", 2),
    entry("pl/mobile", 3),
    entry("pl/api", 1),
    entry("en/api", 1),
    entry("pl/web", 2),
  ];

  it.each([
    ["pl", ["pl/api", "pl/web", "pl/mobile"]],
    ["en", ["en/api", "en/web"]],
  ] as const)("keeps only %s projects sorted by order", (language, ids) => {
    expect(selectProjects(entries, language).map((project) => project.id)).toEqual(ids);
  });
});
