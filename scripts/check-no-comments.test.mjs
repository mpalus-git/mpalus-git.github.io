import { describe, expect, it } from "vitest";
import {
  findAstroComments,
  findCssComments,
  findHashLineComments,
  findHtmlComments,
  findJsonComments,
  findMarkdownComments,
  findYamlComments,
  selectScanner,
} from "./check-no-comments.mjs";

describe("findCssComments", () => {
  it("reports block comments with their line numbers", () => {
    expect(findCssComments(".a {}\n/* note */\n.b {}")).toEqual([2]);
  });

  it("ignores comment markers inside strings and urls", () => {
    const css = '.a { content: "/* no */"; background: url(https://example.com/a.png); }';

    expect(findCssComments(css)).toEqual([]);
  });
});

describe("findJsonComments", () => {
  it("reports line and block comments in tsconfig files", () => {
    const json = '{\n  // strict\n  "strict": true /* block */\n}';

    expect(findJsonComments(json)).toEqual([2, 3]);
  });

  it("ignores comment markers inside string values", () => {
    const json = '{ "paths": { "@/*": ["./src/*"] }, "url": "https://example.com" }';

    expect(findJsonComments(json)).toEqual([]);
  });
});

describe("findHtmlComments", () => {
  it("reports html comments", () => {
    expect(findHtmlComments("<div>\n<!-- hidden -->\n</div>")).toEqual([2]);
  });
});

describe("findAstroComments", () => {
  it("reports html comments in the template and css comments in style blocks", () => {
    const astro =
      "---\nconst a = 1;\n---\n<div>\n<!-- hidden -->\n</div>\n<style>\n.a {}\n/* note */\n</style>";

    expect(findAstroComments(astro)).toEqual([5, 9]);
  });

  it("ignores comment markers in style strings and outside style blocks", () => {
    const astro =
      '<a href="https://example.com/*">x</a>\n<style>\n.a { content: "/* no */"; }\n</style>';

    expect(findAstroComments(astro)).toEqual([]);
  });
});

describe("findMarkdownComments", () => {
  it("reports html comments, link reference comments and frontmatter comments", () => {
    const markdown = "---\ntitle: FixFlow # name\n---\n\nText\n<!-- hidden -->\n[//]: # (note)";

    expect(findMarkdownComments(markdown)).toEqual([2, 6, 7]);
  });

  it("ignores hash characters in headings and regular links", () => {
    const markdown = '---\ntitle: "Issue #1"\n---\n\n# Heading\n[docs]: https://example.com/#top';

    expect(findMarkdownComments(markdown)).toEqual([]);
  });
});

describe("findYamlComments", () => {
  it("reports full line and trailing comments", () => {
    const yaml = "# workflow\non: push\nruns-on: ubuntu-latest # runner";

    expect(findYamlComments(yaml)).toEqual([1, 3]);
  });

  it("ignores hash characters inside quotes and without preceding whitespace", () => {
    const yaml = "color: \"#ffffff\"\nname: 'issue #1'\nurl: https://example.com/#top";

    expect(findYamlComments(yaml)).toEqual([]);
  });
});

describe("findHashLineComments", () => {
  it("reports lines starting with a hash or semicolon", () => {
    expect(findHashLineComments("node_modules/\n# build output\ndist/\n; note")).toEqual([2, 4]);
  });
});

describe("selectScanner", () => {
  it("chooses a scanner by file name or extension", () => {
    expect(selectScanner("src/pages/index.astro")).toBe(findAstroComments);
    expect(selectScanner("src/content/projects/pl/fixflow-api.md")).toBe(findMarkdownComments);
    expect(selectScanner("src/styles/global.css")).toBe(findCssComments);
    expect(selectScanner("tsconfig.json")).toBe(findJsonComments);
    expect(selectScanner(".github/workflows/ci.yml")).toBe(findYamlComments);
    expect(selectScanner("public/favicon.svg")).toBe(findHtmlComments);
    expect(selectScanner(".gitignore")).toBe(findHashLineComments);
    expect(selectScanner("src/config.ts")).toBeNull();
  });
});
