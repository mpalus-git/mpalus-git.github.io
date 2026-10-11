import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://mpalus-git.github.io",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
  },
});
