import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// --- Configuration ---

// Initialize Upstash Redis & Ratelimit safely
// We do this outside the handler to reuse connections, but wrapped in try/catch or checks if necessary.
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
    UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
        ? new Redis({
            url: UPSTASH_REDIS_REST_URL,
            token: UPSTASH_REDIS_REST_TOKEN,
        })
        : null;

// Create a rate limiter: 20 requests per 60s
const ratelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(20, "60s"),
        ephemeralCache: new Map(),
        analytics: true, // Enable analytics for the dashboard
    })
    : null;

// Initialize next-intl middleware
const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // -----------------------------------------------------------------------
    // 0. ADMIN AUTHENTICATION
    // -----------------------------------------------------------------------
    // Define protected paths
    const isAdminPath = pathname.startsWith('/admin/dashboard');
    const isAnalyticsApi = pathname.startsWith('/api/analytics');

    if (isAdminPath || isAnalyticsApi) {
        // We need the admin key from env. 
        // Note: In middleware (Edge), process.env is available but make sure it's populated.
        const ADMIN_KEY = process.env.ADMIN_ACCESS_KEY || process.env.ADMIN_DASHBOARD_KEY;
        const urlKey = request.nextUrl.searchParams.get("key");
        const sessionCookie = request.cookies.get("admin_session");

        // A. Login Attempt (URL ?key=...)
        // If user hits /admin/dashboard?key=SECRET, we validate and set cookie.
        if (isAdminPath && urlKey) {
            if (urlKey === ADMIN_KEY) {
                // Determine redirect URL (strip the key from the URL)
                const nextUrl = new URL(request.url);
                nextUrl.searchParams.delete("key");

                const res = NextResponse.redirect(nextUrl);

                // Set HttpOnly cookie (simulating a session)
                res.cookies.set("admin_session", "authenticated", {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: "strict",
                    path: "/",
                    maxAge: 60 * 60 * 24 // 24 hours
                });
                return res;
            } else {
                // Invalid Key provided in URL -> 403
                return new Response("Forbidden: Invalid Admin Key", { status: 403 });
            }
        }

        // B. Session Check
        // If no URL key, check for valid cookie.
        if (!sessionCookie || sessionCookie.value !== "authenticated") {
            // For API: JSON 401
            if (isAnalyticsApi) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" }
                });
            }
            // For Page: Simple 403 text or Redirect
            return new Response("Forbidden: Access Denied. Please provide a valid key.", { status: 403 });
        }

        // C. If authorized (Cookie exists), proceed.
    }


    // 1. Bypass Logic (Redundant if matcher is perfect, but good for safety)
    // If the matcher misses something, we exit early for statics/internals.
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // 2. Rate Limiting (Only for specific API routes)
    const isRateLimitedPath = pathname === "/api/generate-schedule" || pathname === "/api/analytics";
    let rateLimitResult = null;

    if (isRateLimitedPath && ratelimit) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";

        try {
            rateLimitResult = await ratelimit.limit(ip);

            if (!rateLimitResult.success) {
                return new Response(JSON.stringify({
                    error: "Rate limit exceeded",
                    details: "Please try again in a minute."
                }), {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "X-RateLimit-Limit": String(rateLimitResult.limit),
                        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
                        "X-Frame-Options": "SAMEORIGIN",
                        "X-Content-Type-Options": "nosniff"
                    }
                });
            }
        } catch (err) {
            console.error("Rate limit error:", err);
            // Fail open: if rate limiter fails, allow request
        }
    }

    // 3. Routing Logic
    // If it's an API route or Admin route, we SKIP next-intl middleware.
    // We strictly use next-intl ONLY for public-facing localized pages.
    let response: NextResponse | Response;

    if (pathname.startsWith('/api') || pathname.startsWith('/admin')) {
        response = NextResponse.next();
    } else {
        response = intlMiddleware(request);
    }

    // 4. Security Headers
    // Apply consistent security headers to the final response
    if (response instanceof NextResponse || response instanceof Response) {
        response.headers.set("X-DNS-Prefetch-Control", "on");
        response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
        response.headers.set("X-Frame-Options", "SAMEORIGIN");
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");

        if (rateLimitResult && rateLimitResult.success) {
            response.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
            response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
        }
    }

    return response;
}

export const config = {
    // Matcher:
    // Update to include API routes and Admin routes clearly, while excluding static assets.
    // We remove the explicit exclusion of "api" so we can run logic on it.
    matcher: ['/((?!_next|favicon.ico).*)']
};
