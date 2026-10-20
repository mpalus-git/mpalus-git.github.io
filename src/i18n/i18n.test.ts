import { describe, expect, it } from "vitest";
import { en } from "@/i18n/en";
import { getLanguageFromPath, getLocalizedPath, getOtherLanguage, t } from "@/i18n/i18n";
import { pl } from "@/i18n/pl";

describe("dictionaries", () => {
  it("have the same keys in both languages", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(pl).sort());
  });

  it("have no empty texts", () => {
    for (const text of [...Object.values(pl), ...Object.values(en)]) {
      expect(text.trim()).not.toBe("");
    }
  });

  it("are used by t", () => {
    expect(t("pl", "skipToContent")).toBe("Przejdź do treści");
    expect(t("en", "skipToContent")).toBe("Skip to content");
  });

  it("fill in parameters", () => {
    expect(t("pl", "projectDetailsLabel", { title: "FixFlow.Web" })).toBe(
      "Szczegóły projektu FixFlow.Web",
    );
    expect(t("en", "projectDetailsLabel", { title: "FixFlow.Web" })).toBe(
      "FixFlow.Web project details",
    );
  });

  it("insert parameters without changing them", () => {
    expect(t("pl", "screenshotEnlargeLabel", { alt: "Lista zleceń w panelu" })).toBe(
      "Powiększ: Lista zleceń w panelu",
    );
  });

  it("bind single-letter words to the next word", () => {
    expect(t("pl", "diagramDescription")).toContain("(FixFlow.Web) i aplikacja");
    expect(t("pl", "diagramDescription")).toContain("dane w PostgreSQL");
  });
});

describe("getLanguageFromPath", () => {
  it.each([
    ["/", "pl"],
    ["/404/", "pl"],
    ["/fixflow-web/", "pl"],
    ["/en/", "en"],
    ["/en", "en"],
    ["/en/404/", "en"],
    ["/en/fixflow-web/", "en"],
    ["/english/", "pl"],
  ])("detects the language of %s", (path, language) => {
    expect(getLanguageFromPath(path)).toBe(language);
  });
});

describe("getLocalizedPath", () => {
  it.each([
    ["/", "en", "/en/"],
    ["/en/", "pl", "/"],
    ["/404/", "en", "/en/404/"],
    ["/404.html", "en", "/en/404/"],
    ["/en/404/", "pl", "/404.html"],
    ["/404/", "pl", "/404.html"],
    ["/fixflow-mobile/", "en", "/en/fixflow-mobile/"],
    ["/en/fixflow-mobile/", "pl", "/fixflow-mobile/"],
    ["/fixflow-api", "en", "/en/fixflow-api/"],
    ["/en", "pl", "/"],
  ] as const)("maps %s to %s as %s", (path, language, expected) => {
    expect(getLocalizedPath(path, language)).toBe(expected);
  });

  it("keeps the path when the language does not change", () => {
    expect(getLocalizedPath("/en/fixflow-web/", "en")).toBe("/en/fixflow-web/");
    expect(getLocalizedPath("/fixflow-web/", "pl")).toBe("/fixflow-web/");
  });
});

describe("getOtherLanguage", () => {
  it("returns the other language", () => {
    expect(getOtherLanguage("pl")).toBe("en");
    expect(getOtherLanguage("en")).toBe("pl");
  });
});
