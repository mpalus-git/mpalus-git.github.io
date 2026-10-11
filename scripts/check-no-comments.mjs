import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { pathToFileURL } from "node:url";

const lineOf = (text, index) => text.slice(0, index).split("\n").length;

function scanOutsideStrings(text, quotes, onCode) {
  const lines = [];
  let quote = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === "\\") {
        index += 1;
      } else if (char === quote) {
        quote = null;
      }
    } else if (quotes.includes(char)) {
      quote = char;
    } else {
      const skip = onCode(index);
      if (skip !== null) {
        lines.push(lineOf(text, index));
        index = skip;
      }
    }
  }
  return lines;
}

export function findCssComments(text) {
  return scanOutsideStrings(text, ["'", '"'], (index) => {
    if (!text.startsWith("/*", index)) {
      return null;
    }
    const end = text.indexOf("*/", index + 2);
    return end === -1 ? text.length : end + 1;
  });
}

export function findJsonComments(text) {
  return scanOutsideStrings(text, ['"'], (index) => {
    if (text.startsWith("//", index)) {
      const end = text.indexOf("\n", index);
      return end === -1 ? text.length : end;
    }
    if (text.startsWith("/*", index)) {
      const end = text.indexOf("*/", index + 2);
      return end === -1 ? text.length : end + 1;
    }
    return null;
  });
}

export function findHtmlComments(text) {
  const lines = [];
  let index = text.indexOf("<!--");
  while (index !== -1) {
    lines.push(lineOf(text, index));
    index = text.indexOf("<!--", index + 4);
  }
  return lines;
}

export function findAstroComments(text) {
  const lines = findHtmlComments(text);
  for (const match of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    const offset = lineOf(text, match.index + match[0].indexOf(match[1])) - 1;
    for (const line of findCssComments(match[1])) {
      lines.push(offset + line);
    }
  }
  return lines.sort((first, second) => first - second);
}

export function findMarkdownComments(text) {
  const lines = findHtmlComments(text);
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (frontmatter) {
    for (const line of findYamlComments(frontmatter[1])) {
      lines.push(line + 1);
    }
  }
  text.split("\n").forEach((line, lineIndex) => {
    if (/^\s*\[[^\]]*\]:\s*(#|<>|\(\))/.test(line)) {
      lines.push(lineIndex + 1);
    }
  });
  return lines.sort((first, second) => first - second);
}

export function findYamlComments(text) {
  const lines = [];
  text.split("\n").forEach((line, lineIndex) => {
    let quote = null;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (quote) {
        if (char === quote) {
          quote = null;
        }
      } else if (char === "'" || char === '"') {
        quote = char;
      } else if (char === "#" && (index === 0 || /\s/.test(line[index - 1] ?? ""))) {
        lines.push(lineIndex + 1);
        return;
      }
    }
  });
  return lines;
}

export function findHashLineComments(text) {
  const lines = [];
  text.split("\n").forEach((line, lineIndex) => {
    if (/^\s*[#;]/.test(line)) {
      lines.push(lineIndex + 1);
    }
  });
  return lines;
}

const hashLineFiles = new Set([
  ".editorconfig",
  ".gitignore",
  ".gitattributes",
  ".prettierignore",
  ".nvmrc",
]);

export function selectScanner(path) {
  const name = basename(path);
  const extension = extname(path);
  if (hashLineFiles.has(name)) {
    return findHashLineComments;
  }
  if (extension === ".astro") {
    return findAstroComments;
  }
  if (extension === ".md") {
    return findMarkdownComments;
  }
  if (extension === ".css") {
    return findCssComments;
  }
  if (extension === ".html" || extension === ".svg") {
    return findHtmlComments;
  }
  if (extension === ".yml" || extension === ".yaml") {
    return findYamlComments;
  }
  if (extension === ".json") {
    return findJsonComments;
  }
  return null;
}

function listProjectFiles() {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8" },
  );
  return output.split("\0").filter((path) => path !== "" && existsSync(path));
}

function main() {
  const violations = [];
  for (const path of listProjectFiles()) {
    const scanner = selectScanner(path);
    if (scanner) {
      const text = readFileSync(path, "utf8");
      for (const line of scanner(text)) {
        violations.push(`${path}:${String(line)}`);
      }
    }
  }
  if (violations.length > 0) {
    console.error("Comments are not allowed:");
    for (const violation of violations) {
      console.error(`  ${violation}`);
    }
    process.exit(1);
  }
  console.log("No comments found.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
