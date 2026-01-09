import "server-only";
import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ["error", "warn"],
        datasources: {
            db: {
                url: env.DATABASE_URL,
            },
        },
    });

// --- SAFETY CHECK ---
if (env.NODE_ENV === "development" && env.VERCEL !== "1") {
    const dbUrl = env.DATABASE_URL;

    // env.DATABASE_URL is guaranteed to exist by env.ts validation

    try {
        const urlObj = new URL(dbUrl);
        const hostname = urlObj.hostname;

        const prodHostsRaw = env.PROD_DB_HOSTS || "";
        const prodHosts = prodHostsRaw.split(",").map(h => h.trim()).filter(Boolean);

        const isNeon = hostname.includes("neon.tech");

        // SAFETY: Check against explicit PROD_DB_HOSTS or explicit DATABASE_URL_PROD hostname
        const prodUrlRaw = env.DATABASE_URL_PROD;
        let prodHostname = "";
        if (prodUrlRaw) {
            try {
                prodHostname = new URL(prodUrlRaw).hostname;
            } catch (e) { /* ignore invalid prod url in checking */ }
        }

        if ((prodHosts.length > 0 && prodHosts.includes(hostname)) || (prodHostname && hostname === prodHostname)) {
            throw new Error("Match found in PROD_DB_HOSTS or DATABASE_URL_PROD");
        }

    } catch (e: any) {
        const msg = e.message || "Unknown error";
        if (msg.includes("Match found in PROD_DB_HOSTS")) {
            console.error(
                "\n\n🚨 CRITICAL SAFETY ERROR 🚨\n" +
                "You are running in DEVELOPMENT mode but your DATABASE_URL points to a generic or production host: " + new URL(dbUrl).hostname + "\n" +
                "Blocked by PROD_DB_HOSTS check.\n" +
                "Please point to your specific Neon DEVELOPMENT branch in .env.local.\n" +
                "See docs/ENV_SETUP.md for instructions.\n\n"
            );
            throw new Error("SAFETY: blocked connection to production DB in dev.");
        }
    }

    globalForPrisma.prisma = prisma;
}
