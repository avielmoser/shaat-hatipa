"use server";

import { loginWithKey, logout as sessionLogout } from "@/lib/session";
import { redirect } from "next/navigation";

export interface LoginState {
    error?: string;
}

// Authenticate Action
export async function authenticate(prevState: LoginState, formData: FormData): Promise<LoginState> {
    const key = formData.get("key") as string;

    if (!key) {
        return { error: "נא להזין מפתח כניסה" };
    }

    try {
        const success = await loginWithKey(key);
        if (success) {
            redirect("/admin");
        } else {
            return { error: "מפתח לא נכון" };
        }
    } catch (e: any) {
        // Handle Next.js Redirect (do not catch it as error)
        if (e.message === "NEXT_REDIRECT") {
            throw e;
        }

        // Log real error on server
        console.error("[AdminAuth] Login Error:", e);

        // Return generic Hebrew error to user
        return { error: "שגיאת מערכת. נסה שוב מאוחר יותר." };
    }

    // Fallback (should be unreachable on success due to redirect)
    return { error: "שגיאה לא צפויה" };
}

// Logout Action
export async function logout() {
    await sessionLogout();
    redirect("/admin/login");
}
