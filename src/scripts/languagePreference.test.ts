import { describe, expect, it } from "vitest";
import {
  buildLanguageScript,
  decideLanguage,
  hashScript,
  runLanguagePreference,
  type LanguageDecisionInput,
  type LanguageEnvironment,
} from "@/scripts/languagePreference";

const chromeUserAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36";

function decide(overrides: Partial<LanguageDecisionInput>) {
  return decideLanguage({
    currentLanguage: "pl",
    storedLanguage: null,
    browserLanguages: [],
    userAgent: chromeUserAgent,
    isExternalEntry: true,
    ...overrides,
  });
}

describe("decideLanguage", () => {
  it("prefers the stored choice over the browser languages", () => {
    expect(decide({ storedLanguage: "en", browserLanguages: ["pl-PL"] })).toBe("en");
    expect(
      decide({ currentLanguage: "en", storedLanguage: "pl", browserLanguages: ["en-US"] }),
    ).toBe("pl");
  });

  it("ignores an unknown stored value", () => {
    expect(decide({ storedLanguage: "de", browserLanguages: ["en-US"] })).toBe("en");
  });

  it.each([[["pl-PL"]], [["pl"]], [["PL-pl"]], [["en-US", "pl"]], [["en-GB", "de-DE", "pl-PL"]]])(
    "keeps Polish for %j",
    (browserLanguages) => {
      expect(decide({ browserLanguages })).toBeNull();
      expect(decide({ currentLanguage: "en", browserLanguages })).toBe("pl");
    },
  );

  it.each([[["en-US"]], [["en-US", "de-DE"]], [["de-DE"]], [["uk-UA", "ru"]]])(
    "chooses English for %j",
    (browserLanguages) => {
      expect(decide({ browserLanguages })).toBe("en");
      expect(decide({ currentLanguage: "en", browserLanguages })).toBeNull();
    },
  );

  it("falls back to Polish without any data", () => {
    expect(decide({ browserLanguages: [] })).toBeNull();
    expect(decide({ currentLanguage: "en", browserLanguages: [] })).toBe("pl");
  });

  it.each([
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
    "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
    "Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse",
  ])("does not redirect robots: %s", (userAgent) => {
    expect(decide({ userAgent, browserLanguages: ["en-US"] })).toBeNull();
  });

  it("does not redirect headless browsers used in tests", () => {
    const userAgent = chromeUserAgent.replace("Chrome/", "HeadlessChrome/");

    expect(decide({ userAgent, browserLanguages: ["en-US"] })).toBe("en");
  });

  it("never redirects during internal navigation", () => {
    expect(decide({ isExternalEntry: false, browserLanguages: ["en-US"] })).toBeNull();
    expect(decide({ isExternalEntry: false, storedLanguage: "en" })).toBeNull();
  });
});

type FakeOptions = {
  lang?: string;
  languages?: readonly string[];
  language?: string;
  referrer?: string;
  hash?: string;
  search?: string;
  local?: Map<string, string> | "blocked";
  session?: Map<string, string> | "blocked";
};

function createStorage(store: Map<string, string> | "blocked") {
  return {
    getItem: (key: string) => {
      if (store === "blocked") {
        throw new Error("SecurityError");
      }
      return store.get(key) ?? null;
    },
    setItem: (key: string, value: string) => {
      if (store === "blocked") {
        throw new Error("SecurityError");
      }
      store.set(key, value);
    },
  };
}

function createEnvironment(options: FakeOptions = {}) {
  const replaced: string[] = [];
  const clickListeners: ((event: { target: unknown }) => void)[] = [];
  const local = options.local ?? new Map<string, string>();
  const session = options.session ?? new Map<string, string>();
  const alternates: Record<string, string> = {
    pl: "https://mpalus-git.github.io/404.html",
    en: "https://mpalus-git.github.io/en/404/",
  };
  const environment: LanguageEnvironment = {
    get localStorage() {
      if (local === "blocked") {
        throw new Error("SecurityError");
      }
      return createStorage(local);
    },
    get sessionStorage() {
      if (session === "blocked") {
        throw new Error("SecurityError");
      }
      return createStorage(session);
    },
    document: {
      documentElement: { lang: options.lang ?? "pl" },
      referrer: options.referrer ?? "",
      querySelector: (selector) => {
        const match = /hreflang="(\w+)"/.exec(selector);
        const href = match?.[1] ? alternates[match[1]] : undefined;
        return href ? { getAttribute: () => href } : null;
      },
      addEventListener: (_type, listener) => {
        clickListeners.push(listener);
      },
    },
    location: {
      origin: "http://localhost:4321",
      search: options.search ?? "",
      hash: options.hash ?? "",
      replace: (url) => {
        replaced.push(url);
      },
    },
    navigator: {
      languages: options.languages ?? ["en-US"],
      language: options.language ?? "en-US",
      userAgent: chromeUserAgent,
    },
  };
  const click = (language: string | null) => {
    const link = { getAttribute: () => language };
    for (const listener of clickListeners) {
      listener({ target: { closest: () => link } });
    }
  };
  return { environment, replaced, click, local, session };
}

describe("runLanguagePreference", () => {
  it("redirects with replace to the alternate path and keeps the hash and query", () => {
    const { environment, replaced } = createEnvironment({ hash: "#fixflow", search: "?a=1" });

    runLanguagePreference(environment, decideLanguage);

    expect(replaced).toEqual(["/en/404/?a=1#fixflow"]);
  });

  it("stays on the page when the browser prefers Polish", () => {
    const { environment, replaced } = createEnvironment({ languages: ["en-US", "pl"] });

    runLanguagePreference(environment, decideLanguage);

    expect(replaced).toEqual([]);
  });

  it("uses navigator.language when navigator.languages is empty", () => {
    const { environment, replaced } = createEnvironment({ languages: [], language: "pl-PL" });

    runLanguagePreference(environment, decideLanguage);

    expect(replaced).toEqual([]);
  });

  it("marks the tab so later pages are treated as internal navigation", () => {
    const session = new Map<string, string>();
    const first = createEnvironment({ session, languages: ["pl-PL"] });
    runLanguagePreference(first.environment, decideLanguage);
    const second = createEnvironment({ session, languages: ["en-US"] });

    runLanguagePreference(second.environment, decideLanguage);

    expect(session.get("portfolio-language-session")).toBe("1");
    expect(second.replaced).toEqual([]);
  });

  it("follows the stored choice over the browser languages", () => {
    const local = new Map([["portfolio-language", "pl"]]);
    const { environment, replaced } = createEnvironment({ lang: "en", local });

    runLanguagePreference(environment, decideLanguage);

    expect(replaced).toEqual(["/404.html"]);
  });

  it("treats a same-origin referrer as internal navigation", () => {
    const { environment, replaced } = createEnvironment({
      referrer: "http://localhost:4321/en/",
      session: "blocked",
    });

    runLanguagePreference(environment, decideLanguage);

    expect(replaced).toEqual([]);
  });

  it("decides from the browser languages when storage is blocked", () => {
    const { environment, replaced } = createEnvironment({ local: "blocked", session: "blocked" });

    runLanguagePreference(environment, decideLanguage);

    expect(replaced).toEqual(["/en/404/"]);
  });

  it("does not redirect again on the target page when storage is blocked", () => {
    const { environment, replaced } = createEnvironment({
      lang: "en",
      local: "blocked",
      session: "blocked",
    });

    runLanguagePreference(environment, decideLanguage);

    expect(replaced).toEqual([]);
  });

  it("stores the language chosen with the switch", () => {
    const local = new Map<string, string>();
    const { environment, click } = createEnvironment({ local, languages: ["pl-PL"] });
    runLanguagePreference(environment, decideLanguage);

    click("en");

    expect(local.get("portfolio-language")).toBe("en");
  });

  it("ignores clicks outside the switch and failing writes", () => {
    const blocked = createEnvironment({ local: "blocked", languages: ["pl-PL"] });
    runLanguagePreference(blocked.environment, decideLanguage);
    const local = new Map<string, string>();
    const outside = createEnvironment({ local, languages: ["pl-PL"] });
    runLanguagePreference(outside.environment, decideLanguage);

    expect(() => {
      blocked.click("en");
    }).not.toThrow();
    outside.click(null);
    expect(local.has("portfolio-language")).toBe(false);
  });

  it("swallows errors thrown by the decision", () => {
    const { environment, replaced } = createEnvironment();

    expect(() => {
      runLanguagePreference(environment, () => {
        throw new Error("unexpected");
      });
    }).not.toThrow();
    expect(replaced).toEqual([]);
  });
});

describe("buildLanguageScript", () => {
  it("produces a self-contained script that runs both functions", () => {
    const script = buildLanguageScript();

    expect(script.startsWith("(function runLanguagePreference(")).toBe(true);
    expect(script).toContain("function decideLanguage(");
    expect(script.endsWith(");")).toBe(true);
  });
});

describe("hashScript", () => {
  it("returns the CSP sha256 source of the script", async () => {
    expect(await hashScript("alert(1)")).toBe(
      "sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI=",
    );
  });
});
