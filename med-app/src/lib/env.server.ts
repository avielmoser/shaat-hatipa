
/**
 * Lazy Environment Validation (Server-Only).
 * Validates keys only when requested, not at module load time.
 */

export function getSessionPasswordOrThrow(): string {
    const password = process.env.SESSION_PASSWORD;
    if (!password || password.length < 32) {
        throw new Error("SERVER_ERROR: SESSION_PASSWORD is missing or shorter than 32 chars.");
    }
    return password;
}

export function getAdminKeyOrThrow(): string {
    const key = process.env.ADMIN_DASHBOARD_KEY || process.env.ADMIN_ACCESS_KEY;
    if (!key) {
        throw new Error("SERVER_ERROR: No ADMIN_DASHBOARD_KEY or ADMIN_ACCESS_KEY configured.");
    }
    return key;
}

export function isEnvConfigured(): boolean {
    try {
        getSessionPasswordOrThrow();
        getAdminKeyOrThrow();
        return true;
    } catch {
        return false;
    }
}
