import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import { noComments } from "./eslint-rules/noComments.js";

export default defineConfig([
  globalIgnores(["dist", ".astro", "coverage", "playwright-report", "test-results"]),
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
  },
  {
    files: ["**/*.{ts,js,mjs,astro}"],
    plugins: {
      local: { rules: { "no-comments": noComments } },
    },
    rules: {
      "local/no-comments": "error",
    },
  },
  {
    files: ["**/*.{js,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2025,
      globals: globals.node,
    },
  },
  {
    files: ["**/*.{ts,astro}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "ExportDefaultDeclaration",
          message: "Use named exports only.",
        },
      ],
    },
  },
  {
    files: ["vitest.config.ts", "playwright.config.ts", "src/env.d.ts"],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
  astro.configs.recommended,
  astro.configs["jsx-a11y-strict"],
  {
    files: ["**/*.astro"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: false,
        project: true,
        extraFileExtensions: [".astro"],
      },
    },
    rules: {
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },
]);
