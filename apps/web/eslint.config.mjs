import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const eslintConfig = [
  ...nextConfig,
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // ── TypeScript ──
      // Many `any` types in JSON-heavy reading/writing components (CMS data)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow incremental cleanup of unused vars
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],

      // ── Style ──
      "prefer-const": "warn",

      // ── React Hooks ──
      // reading-player, listening-player, grammar use conditional early returns
      "react-hooks/rules-of-hooks": "warn",
      // setState in effects — used safely (e.g., audio player reset)
      "react-hooks/set-state-in-effect": "off",
      // Refs used as sync mirrors in speed-exercise for timer callbacks
      "react-hooks/refs": "off",

      // ── React Hooks v7 / React Compiler rules ──
      // Math.random() in render (dashboard-skeletons animations), etc.
      "react-hooks/purity": "off",
      // Dynamic component creation in render (grammar mocktest)
      "react-hooks/static-components": "off",
      // Variable hoisting patterns
      "react-hooks/invariant": "off",
    },
  },
];

export default eslintConfig;
