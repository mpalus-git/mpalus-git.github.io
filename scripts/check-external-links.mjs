import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { apiReadyUrl } from "../src/config.ts";

const siteOrigin = "https://mpalus-git.github.io";

const timeoutMs = 90_000;

export function findExternalLinks(html, origin) {
  const links = new Set();
  for (const match of html.matchAll(/<a\s[^>]*href="(https:\/\/[^"]+)"/g)) {
    const url = match[1].replaceAll("&amp;", "&");
    if (new URL(url).origin !== origin) {
      links.add(url);
    }
  }
  return links;
}

async function requestOnce(url, fetchImpl) {
  try {
    const response = await fetchImpl(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    return response.ok ? null : `HTTP ${String(response.status)}`;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export async function checkLink(url, fetchImpl = fetch) {
  const firstProblem = await requestOnce(url, fetchImpl);
  return firstProblem === null ? null : requestOnce(url, fetchImpl);
}

function collectSiteLinks(directory) {
  const links = new Set();
  for (const entry of readdirSync(directory, { recursive: true, withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".html")) {
      const html = readFileSync(join(entry.parentPath, entry.name), "utf8");
      for (const link of findExternalLinks(html, siteOrigin)) {
        links.add(link);
      }
    }
  }
  return links;
}

async function main() {
  const urls = [...collectSiteLinks("dist"), apiReadyUrl].sort();
  const results = await Promise.all(urls.map(async (url) => [url, await checkLink(url)]));
  for (const [url, problem] of results) {
    if (problem === null) {
      console.log(`ok ${url}`);
    } else {
      console.log(`::warning title=External link::${url} - ${problem}`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
