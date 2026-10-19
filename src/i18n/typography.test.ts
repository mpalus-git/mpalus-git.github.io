import { describe, expect, it } from "vitest";
import { bindSingleLetterWords, bindSingleLetterWordsPlugin } from "@/i18n/typography";

const nbsp = " ";

describe("bindSingleLetterWords", () => {
  it.each([
    ["aplikacja w .NET MAUI", `aplikacja w${nbsp}.NET MAUI`],
    ["panel i aplikacja", `panel i${nbsp}aplikacja`],
    ["dane a reguły", `dane a${nbsp}reguły`],
    ["prośba o zgodę", `prośba o${nbsp}zgodę`],
    ["u klienta", `u${nbsp}klienta`],
    ["z bazy", `z${nbsp}bazy`],
    ["W terenie i Z zasięgiem", `W${nbsp}terenie i${nbsp}Z${nbsp}zasięgiem`],
    ["build a dispatcher panel I wrote", `build a${nbsp}dispatcher panel I${nbsp}wrote`],
  ])("binds the single-letter word in %s", (text, expected) => {
    expect(bindSingleLetterWords(text)).toBe(expected);
  });

  it("binds consecutive single-letter words", () => {
    expect(bindSingleLetterWords("zdjęcia i w trybie")).toBe(`zdjęcia i${nbsp}w${nbsp}trybie`);
  });

  it("binds words after brackets and quotes", () => {
    expect(bindSingleLetterWords('(w tle) „z bazy” "i tak"')).toBe(
      `(w${nbsp}tle) „z${nbsp}bazy” "i${nbsp}tak"`,
    );
  });

  it("joins a line break after the word", () => {
    expect(bindSingleLetterWords("panel i\naplikacja")).toBe(`panel i${nbsp}aplikacja`);
  });

  it.each(["technik x dzień", "L1 w", "wariant A", "React i", "Vertical Slice", "API/i odpowiedź"])(
    "leaves %s without a binding space",
    (text) => {
      expect(bindSingleLetterWords(text)).toBe(text);
    },
  );
});

describe("bindSingleLetterWordsPlugin", () => {
  it("replaces a Markdown text node with bound words", () => {
    expect(
      bindSingleLetterWordsPlugin.text({ type: "text", value: "dyspozytor i technik" }),
    ).toEqual({ type: "text", value: `dyspozytor i${nbsp}technik` });
  });

  it("keeps a text node without single-letter words", () => {
    expect(
      bindSingleLetterWordsPlugin.text({ type: "text", value: "Vertical Slice" }),
    ).toBeUndefined();
  });
});
