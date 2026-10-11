import type { Dictionary } from "@/i18n/dictionary";
import { en } from "@/i18n/en";
import { pl } from "@/i18n/pl";

export const languages = ["pl", "en"] as const;

export type Language = (typeof languages)[number];

export const defaultLanguage: Language = "pl";

const dictionaries: Record<Language, Dictionary> = { pl, en };

const englishPrefix = "/en/";

export function t(language: Language, key: keyof Dictionary): string {
  return dictionaries[language][key];
}

export function getOtherLanguage(language: Language): Language {
  return language === "pl" ? "en" : "pl";
}

export function getLanguageFromPath(path: string): Language {
  return path === "/en" || path.startsWith(englishPrefix) ? "en" : "pl";
}

export function getLocalizedPath(path: string, language: Language): string {
  const normalized = path.endsWith("/") ? path : `${path}/`;
  const neutral =
    getLanguageFromPath(normalized) === "en" ? normalized.slice("/en".length) : normalized;
  return language === "en" ? `/en${neutral}` : neutral;
}
