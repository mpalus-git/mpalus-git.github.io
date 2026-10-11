import { describe, expect, it } from "vitest";
import { decideLanguage, type LanguageDecisionInput } from "@/scripts/languagePreference";

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
