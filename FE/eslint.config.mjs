import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
export default defineConfig([
  ...next,
  ...ts,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([".next/**", "public/mockServiceWorker.js"]),
]);
