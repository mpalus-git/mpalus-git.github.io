import type { Language } from "@/i18n/i18n";

export type LanguageDecisionInput = {
  currentLanguage: Language;
  storedLanguage: string | null;
  browserLanguages: readonly string[];
  userAgent: string;
  isExternalEntry: boolean;
};

export function decideLanguage(input: LanguageDecisionInput): Language | null {
  const botPattern =
    /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|embedly|whatsapp|preview|vkshare|pinterest|yandex|baidu|lighthouse/i;
  if (!input.isExternalEntry || botPattern.test(input.userAgent)) {
    return null;
  }
  let preferred: Language = "pl";
  if (input.storedLanguage === "pl" || input.storedLanguage === "en") {
    preferred = input.storedLanguage;
  } else if (input.browserLanguages.length > 0) {
    preferred = input.browserLanguages.some((language) => language.toLowerCase().startsWith("pl"))
      ? "pl"
      : "en";
  }
  return preferred === input.currentLanguage ? null : preferred;
}
