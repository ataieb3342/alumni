// eslint-config-next >= 16 publie directement des configs « flat ».
// Ne pas repasser par FlatCompat : l'API legacy ne sait pas les lire et échoue
// sur « Converting circular structure to JSON ».
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "*.tsbuildinfo",
      // Scripts ponctuels non versionnés (anciennement branchés sur Sanity)
      "scripts/**",
      ".data/**",
      ".migration/**",
      "docs/perf/**",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    // Règles reprises de l'ancien .eslintrc.json
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@next/next/no-html-link-for-pages": "warn",
    },
  },
];

export default eslintConfig;
