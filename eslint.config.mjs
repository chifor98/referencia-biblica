import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy vanilla-JS app being replaced by this migration, plus temporary
    // agent worktrees (not part of the Next.js app).
    ".claude/**",
    "components/*.js",
    "script.js",
    "config.js",
    "server.js",
    "tools/**",
    ".tools/**",
  ]),
]);

export default eslintConfig;
