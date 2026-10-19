import type { Dictionary } from "@/i18n/dictionary";
import { en } from "@/i18n/en";
import { pl } from "@/i18n/pl";
import { bindSingleLetterWords } from "@/i18n/typography";

export const languages = ["pl", "en"] as const;

export type Language = (typeof languages)[number];

export const defaultLanguage: Language = "pl";

const dictionaries: Record<Language, Dictionary> = { pl, en };

const englishPrefix = "/en/";

const notFoundPath = "/404/";

const notFoundFile = "/404.html";

export function t(language: Language, key: keyof Dictionary): string {
  return bindSingleLetterWords(dictionaries[language][key]);
}

export function getOtherLanguage(language: Language): Language {
  return language === "pl" ? "en" : "pl";
}

export function getLanguageFromPath(path: string): Language {
  return path === "/en" || path.startsWith(englishPrefix) ? "en" : "pl";
}

export function getLocalizedPath(path: string, language: Language): string {
  const normalized = normalizePath(path);
  const neutral =
    getLanguageFromPath(normalized) === "en" ? normalized.slice("/en".length) : normalized;
  if (language === "en") {
    return `/en${neutral}`;
  }
  return neutral === notFoundPath ? notFoundFile : neutral;
}

function normalizePath(path: string): string {
  if (path === notFoundFile) {
    return notFoundPath;
  }
  return path.endsWith("/") ? path : `${path}/`;
}
