import "server-only";
import { PrismaClient } from "@prisma/client";


const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ["error", "warn"],
        datasources: {
            db: {
                url: process.env.DATABASE_URL || "", // Fallback to empty string if missing, handled by Prisma runtim
            },
        },
    });

// --- STRICT SAFETY CHECK ---
// This runs on every cold start in production and development.

const dbUrl = process.env.DATABASE_URL || "";
if (dbUrl) {
    try {
        const urlObj = new URL(dbUrl);
        const hostname = urlObj.hostname;
        const isNeon = hostname.includes("neon.tech");

        // DEFINED HOSTNAMES (Source of Truth)
        const HOST_PROD = "ep-misty-feather-agshpgmp-pooler.c-2.eu-central-1.aws.neon.tech";
        const HOST_DEV = "ep-mute-shape-agvuwmh8-pooler.c-2.eu-central-1.aws.neon.tech";

        const isProductionEnv = process.env.NODE_ENV === "production";

        // Log for observability (Requirement B)
        let branchId = "unknown";
        if (isNeon) {
            branchId = hostname.split('.')[0] || "unknown";
        }

        const logMsg = `[ENV CHECK] env=${process.env.NODE_ENV} db_host=${hostname} expected=${isProductionEnv ? 'prod' : 'dev'}`;
        console.log(logMsg);

        // RULE 1: If PRODUCTION env, MUST match the specific Production host.
        if (isProductionEnv) {
            // We allow exact match.
            if (hostname !== HOST_PROD) {
                // FAIL LOUDLY
                const msg =
                    `\n🚨 FATAL CONFIGURATION ERROR 🚨\n` +
                    `NODE_ENV is 'production', but DATABASE_URL hostname '${hostname}' is NOT the verified Production Host.\n` +
                    `Expected: ${HOST_PROD}\n` +
                    `Received: ${hostname}\n`;
                console.error(msg);
                throw new Error("FATAL: Environment is connected to the wrong database.");
            }
        }

        // RULE 2: If NOT production env, MUST NOT match the Production host.
        if (!isProductionEnv) {
            if (hostname === HOST_PROD) {
                const msg =
                    `\n🚨 CRITICAL SAFETY ERROR 🚨\n` +
                    `You are running in '${process.env.NODE_ENV}' mode but DATABASE_URL points to the PRODUCTION host.\n` +
                    `Blocked connection to: ${hostname}\n` +
                    `Please point to your specific Neon DEVELOPMENT branch (${HOST_DEV}) in .env.local.\n`;
                console.error(msg);
                throw new Error("FATAL: Environment is connected to the wrong database.");
            }
        }

    } catch (e: any) {
        // Re-throw if it's our safety error
        if (e.message && e.message.includes("FATAL:")) {
            throw e;
        }
        // If malformed URL etc, let Prisma handle it or fail later, but warn.
        console.warn("[ENV CHECK] Could not validate DB URL safety:", e.message);
    }
}

globalForPrisma.prisma = prisma;
