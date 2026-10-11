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

type StorageLike = Pick<Storage, "getItem" | "setItem">;

type ClosestTarget = {
  closest(selector: string): { getAttribute(name: string): string | null } | null;
};

export type LanguageEnvironment = {
  readonly localStorage: StorageLike;
  readonly sessionStorage: StorageLike;
  document: {
    documentElement: { lang: string };
    referrer: string;
    querySelector(selector: string): { getAttribute(name: string): string | null } | null;
    addEventListener(type: "click", listener: (event: { target: unknown }) => void): void;
  };
  location: { origin: string; search: string; hash: string; replace(url: string): void };
  navigator: { languages?: readonly string[]; language?: string; userAgent: string };
};

export function runLanguagePreference(
  environment: LanguageEnvironment,
  decide: (input: LanguageDecisionInput) => Language | null,
): void {
  const storageKey = "portfolio-language";
  const sessionKey = "portfolio-language-session";
  const read = (storage: () => StorageLike, key: string): string | null => {
    try {
      return storage().getItem(key);
    } catch {
      return null;
    }
  };
  const write = (storage: () => StorageLike, key: string, value: string): void => {
    try {
      storage().setItem(key, value);
    } catch {
      return;
    }
  };
  const isClosestTarget = (value: unknown): value is ClosestTarget =>
    typeof value === "object" &&
    value !== null &&
    "closest" in value &&
    typeof value.closest === "function";
  const local = () => environment.localStorage;
  const session = () => environment.sessionStorage;
  const { document, location, navigator } = environment;

  document.addEventListener("click", (event) => {
    const link = isClosestTarget(event.target)
      ? event.target.closest("a[data-language-switch]")
      : null;
    const language = link?.getAttribute("data-language-switch");
    if (language) {
      write(local, storageKey, language);
    }
  });

  try {
    let sameOriginReferrer = false;
    try {
      sameOriginReferrer = new URL(document.referrer).origin === location.origin;
    } catch {
      sameOriginReferrer = false;
    }
    const isExternalEntry = read(session, sessionKey) === null && !sameOriginReferrer;
    write(session, sessionKey, "1");
    const browserLanguages =
      navigator.languages && navigator.languages.length > 0
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : [];
    const target = decide({
      currentLanguage: document.documentElement.lang === "en" ? "en" : "pl",
      storedLanguage: read(local, storageKey),
      browserLanguages,
      userAgent: navigator.userAgent,
      isExternalEntry,
    });
    const href = target
      ? document.querySelector(`link[rel="alternate"][hreflang="${target}"]`)?.getAttribute("href")
      : null;
    if (href) {
      location.replace(new URL(href).pathname + location.search + location.hash);
    }
  } catch {
    return;
  }
}

export function buildLanguageScript(): string {
  return `(${runLanguagePreference.toString()})(window,${decideLanguage.toString()});`;
}
