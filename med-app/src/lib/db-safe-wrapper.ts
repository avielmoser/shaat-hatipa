import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";

export type SafeResult<T> =
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string; type: "DB_ERROR" | "UNKNOWN" } };

/**
 * Wraps a Prisma query promise with safe error handling.
 * Catches connection errors (P1001), timeouts, and closed connections.
 */
export async function safeDbQuery<T>(
    queryFn: () => Promise<T>,
    contextName: string
): Promise<SafeResult<T>> {
    try {
        const data = await queryFn();
        return { success: true, data };
    } catch (error: any) {
        // 1. Log the full raw error safely on the server
        logger.error(`DB Query Failed [${contextName}]`, error, {
            code: error?.code,
            meta: error?.meta
        });

        // 2. Classify the error for the client (sanitize)
        let errorCode = "UNKNOWN_ERROR";
        let errorMessage = "An unexpected database error occurred.";

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P1001") {
                errorCode = "DB_CONNECTION_FAILED"; // Cannot reach DB server
                errorMessage = "Database connection unavailable.";
            } else if (error.code === "P1002") {
                errorCode = "DB_TIMEOUT";
                errorMessage = "Database request timed out.";
            } else if (error.code === "P1017") {
                errorCode = "DB_CONNECTION_CLOSED";
                errorMessage = "Server closed the connection.";
            } else {
                errorCode = `DB_${error.code}`;
            }
        } else if (error instanceof Prisma.PrismaClientInitializationError) {
            errorCode = "DB_INIT_FAILED";
            errorMessage = "Database initialization failed (Check Credentials).";
        }

        // Checking for "Closed" kind error which sometimes appears in "UnknownRequestError"
        if (error?.message?.includes("Closed")) {
            errorCode = "DB_CONNECTION_CLOSED";
            errorMessage = "Connection pool closed unexpectedly.";
        }

        return {
            success: false,
            error: {
                type: "DB_ERROR",
                code: errorCode,
                message: errorMessage
            }
        };
    }
}
