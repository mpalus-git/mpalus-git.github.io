import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { apiOrigin } from "./src/config.ts";
import { bindSingleLetterWordsPlugin } from "./src/i18n/typography.ts";

export default defineConfig({
  site: "https://mpalus-git.github.io",
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "pl",
        locales: { pl: "pl", en: "en" },
      },
      filter: (page) => !page.includes("/404"),
    }),
  ],
  i18n: {
    locales: ["pl", "en"],
    defaultLocale: "pl",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
  markdown: {
    syntaxHighlight: false,
    processor: satteri({ hastPlugins: [bindSingleLetterWordsPlugin] }),
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "media-src 'self'",
        "font-src 'none'",
        `connect-src 'self' ${apiOrigin}`,
        "base-uri 'self'",
        "form-action 'none'",
        "object-src 'none'",
      ],
      scriptDirective: {
        resources: ["'self'"],
      },
      styleDirective: {
        resources: ["'self'"],
      },
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
