import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules/", "build/"],
  },
  {
    rules: {
      "linebreak-style": ["error", "unix"],
      curly: "error",
      "require-await": "error",
      "no-unreachable": "error",
      "prefer-const": "error",
      "prefer-template": "error",
    },
  },
];
