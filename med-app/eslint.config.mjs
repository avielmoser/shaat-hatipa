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
  ]),
  {
    files: ["src/domain/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next",
              message: "Domain layer must not depend on Next.js.",
            },
            {
              name: "prisma",
              message: "Domain layer must not depend on Prisma.",
            },
          ],
          patterns: [
            {
              group: ["@/app/**", "@/components/**", "@/infrastructure/**", "next/**", "@prisma/**"],
              message: "Domain layer must remain pure and not depend on UI or Infrastructure.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/application/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "prisma",
              message: "Application layer must not depend on Prisma directly. Use repositories.",
            },
          ],
          patterns: [
            {
              group: ["@/infrastructure/**", "@prisma/**", "@/lib/server/**", "@/lib/client/**"],
              message: "Application layer must depend on Domain only, and use Repository interfaces for Infrastructure.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
