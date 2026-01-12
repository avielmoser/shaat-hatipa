
import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface AdminSession {
    isLoggedIn: boolean;
    loggedInAt?: string;
}

export const defaultSession: AdminSession = {
    isLoggedIn: false,
};

// Lazy session options to avoid import-time env validation errors
export function getSessionOptions(): SessionOptions {
    const password = process.env.SESSION_PASSWORD;

    // Strict validation at runtime
    if (!password || password.length < 32) {
        throw new Error("SERVER_ERROR: SESSION_PASSWORD is missing or shorter than 32 chars.");
    }

    return {
        password,
        cookieName: "admin_session",
        ttl: 60 * 60 * 24 * 7, // 7 days
        cookieOptions: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
        },
    };
}

// 1. Get Session
// We await cookies() as per Next.js 15+ Async Local Storage rules
export async function getSession() {
    const cookieStore = await cookies();
    return getIronSession<AdminSession>(cookieStore, getSessionOptions());
}

// 2. Login Logic
export async function loginWithKey(inputKey: string): Promise<boolean> {
    const canonical = process.env.ADMIN_DASHBOARD_KEY;
    const fallback = process.env.ADMIN_ACCESS_KEY;

    if (!canonical && !fallback) {
        throw new Error("SERVER_ERROR: No ADMIN_DASHBOARD_KEY or ADMIN_ACCESS_KEY configured.");
    }

    // Check against available keys
    const isValid = (!!canonical && inputKey === canonical) ||
        (!!fallback && inputKey === fallback);

    if (isValid) {
        const session = await getSession();
        session.isLoggedIn = true;
        session.loggedInAt = new Date().toISOString();
        await session.save();
        return true;
    }

    return false;
}

// 3. Logout Logic
export async function logout() {
    const session = await getSession();
    session.destroy();
    // iron-session requires save() to clear the cookie in some versions, 
    // but destroy() usually sets maxAge=0. 
    // We strictly follow the session object mutation pattern.
    // For iron-session v8, destroy() is enough but we explicitly retrieve it first.
}
