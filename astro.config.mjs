import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mpalus-git.github.io",
  output: "static",
  trailingSlash: "always",
  i18n: {
    locales: ["pl", "en"],
    defaultLocale: "pl",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    format: "directory",
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
