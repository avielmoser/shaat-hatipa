
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
    const session = await getSession();

    if (session.isLoggedIn) {
        redirect("/admin");
    }

    return (
        <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative font-sans">
            {/* Background Decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <LoginForm />
        </div>
    );
}
