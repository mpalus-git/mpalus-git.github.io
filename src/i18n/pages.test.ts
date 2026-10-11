import { describe, expect, it } from "vitest";
import { getLocalizedPath, languages } from "@/i18n/i18n";

const pageFiles = Object.keys(import.meta.glob("/src/pages/**/*.astro"));

function toServedPath(file: string): string {
  const route = file.replace(/^\/src\/pages/, "").replace(/(index)?\.astro$/, "");
  if (route === "/404") {
    return "/404.html";
  }
  return route.endsWith("/") ? route : `${route}/`;
}

const servedPaths = new Set(pageFiles.map(toServedPath));

describe("pages", () => {
  it("exist in both languages", () => {
    expect(servedPaths).toEqual(new Set(["/", "/en/", "/404.html", "/en/404/"]));
  });

  it.each([...servedPaths])("%s has a counterpart in every language", (path) => {
    for (const language of languages) {
      expect(servedPaths).toContain(getLocalizedPath(path, language));
    }
  });
});
