import { z } from "zod";

/**
 * Environment Variable Validation & Type Definitions
 * 
 * Rules:
 * 1. All env vars used in the app MUST be defined here.
 * 2. This file MUST be imported as early as possible (e.g., db.ts or next.config.ts).
 * 3. Validation happens on import; invalid env vars will throw an error immediately.
 */

const envSchema = z.object({
    // Server-side
    DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL starting with postgresql://"),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    VERCEL: z.string().optional(), // "1" if on Vercel

    // Guardrails
    ADMIN_ACCESS_KEY: z.string().min(1, "ADMIN_ACCESS_KEY is required for dashboard access"),
    PROD_DB_HOSTS: z.string().optional().describe("Comma-separated list of production DB hostnames"),
    DATABASE_URL_PROD: z.string().url().optional().describe("Explicit production DB URL for checking mismatches"),

    // App Config
    NEXT_PUBLIC_APP_URL: z.string().url().optional().default("http://localhost:3000"), // Used for absolute links
    NEXT_PUBLIC_ANALYTICS_DEBUG: z.enum(["0", "1"]).optional().default("0"),
});

// Process Env Parsing
const processEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY,
    PROD_DB_HOSTS: process.env.PROD_DB_HOSTS,
    DATABASE_URL_PROD: process.env.DATABASE_URL_PROD,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_ANALYTICS_DEBUG: process.env.NEXT_PUBLIC_ANALYTICS_DEBUG,
};

// Singleton Lazy Logic
let parsedEnv: z.infer<typeof envSchema> | undefined;

export function getServerEnv() {
    if (parsedEnv) return parsedEnv;

    try {
        // Docker Build Support: Skip validation if flag is set
        if (process.env.SKIP_ENV_VALIDATION === "true" || process.env.SKIP_ENV_VALIDATION === "1") {
            console.warn("⚠️ Skipping environment validation (SKIP_ENV_VALIDATION is set). Using mock values.");
            parsedEnv = {
                DATABASE_URL: "postgresql://mock:mock@localhost:5432/mock",
                NODE_ENV: "development",
                VERCEL: undefined,
                ADMIN_ACCESS_KEY: "mock-key",
                PROD_DB_HOSTS: undefined,
                DATABASE_URL_PROD: undefined,
                NEXT_PUBLIC_APP_URL: "http://localhost:3000",
                NEXT_PUBLIC_ANALYTICS_DEBUG: "0",
            };
        } else {
            parsedEnv = envSchema.parse(processEnv);
        }
        return parsedEnv;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingVars = error.issues.map((issue) => {
                const path = issue.path.join(".");
                return `${path}: ${issue.message}`;
            }).join("\n  - ");

            console.error(
                `\n❌ Invalid environment variables:\n  - ${missingVars}\n\n` +
                `Fix this in your .env file or Vercel project settings.\n`
            );

            // In strict mode, we kill the process.
            throw new Error("Invalid environment variables");
        } else {
            throw error;
        }
    }
}
