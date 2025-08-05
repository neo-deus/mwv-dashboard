import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable warnings about 'any' types - often necessary for third-party libraries
      "@typescript-eslint/no-explicit-any": "off",

      // Disable warnings about unused variables with underscore prefix
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],

      // Allow React Hook dependencies to be managed manually when necessary
      "react-hooks/exhaustive-deps": "warn",

      // Allow unescaped entities in JSX (for apostrophes, quotes, etc.)
      "react/no-unescaped-entities": "off",

      // Allow prefer-const warnings
      "prefer-const": "warn",
    },
  },
];

export default eslintConfig;
