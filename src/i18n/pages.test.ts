import { describe, expect, it } from "vitest";
import { getLocalizedPath, languages } from "@/i18n/i18n";

const pageFiles = Object.keys(import.meta.glob("/src/pages/**/*.astro"));

const projectPrefix = "/src/content/projects/pl/";

const projectNames = Object.keys(import.meta.glob("/src/content/projects/pl/*.md")).map((path) =>
  path.slice(projectPrefix.length, -".md".length),
);

function toServedPaths(file: string): string[] {
  const route = file.replace(/^\/src\/pages/, "").replace(/(index)?\.astro$/, "");
  if (route === "/404") {
    return ["/404.html"];
  }
  const path = route.endsWith("/") ? route : `${route}/`;
  return path.includes("[project]")
    ? projectNames.map((name) => path.replace("[project]", name))
    : [path];
}

const servedPaths = new Set(pageFiles.flatMap(toServedPaths));

describe("pages", () => {
  it("exist in both languages", () => {
    expect(servedPaths).toEqual(
      new Set([
        "/",
        "/en/",
        "/404.html",
        "/en/404/",
        "/fixflow-api/",
        "/fixflow-web/",
        "/fixflow-mobile/",
        "/en/fixflow-api/",
        "/en/fixflow-web/",
        "/en/fixflow-mobile/",
      ]),
    );
  });

  it.each([...servedPaths])("%s has a counterpart in every language", (path) => {
    for (const language of languages) {
      expect(servedPaths).toContain(getLocalizedPath(path, language));
    }
  });
});
