import { getViteConfig } from "astro/config";
import type {} from "vitest/config";

export default getViteConfig({
  test: {
    include: ["**/*.test.{ts,js,mjs}"],
    exclude: ["node_modules/**", "dist/**", ".astro/**", "e2e/**"],
  },
});
