import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check for environment variables (Rate limiting will be disabled if missing)
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    // Production warning: This should be configured in Vercel environment variables.
    console.warn(
        "UPSTASH Redis credentials missing. Rate limiting is DISABLED."
    );
}

// Initialize Upstash Redis and Ratelimit only if credentials exist
const redis =
    UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN
        ? new Redis({
            url: UPSTASH_REDIS_REST_URL,
            token: UPSTASH_REDIS_REST_TOKEN,
        })
        : null;

// 20 requests per minute per IP
const ratelimit = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.fixedWindow(20, "60s"),
        ephemeralCache: new Map(),
        analytics: true,
    })
    : null;

export async function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Add Security Headers
    response.headers.set("X-DNS-Prefetch-Control", "on");
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");

    // Rate Limit Logic for /api/generate-schedule
    if (request.nextUrl.pathname === "/api/generate-schedule" && ratelimit) {
        // Extract IP safely
        const ipHeader = request.headers.get("x-forwarded-for");
        const ipIdentifier = ipHeader?.split(",")[0].trim() || "127.0.0.1";

        // Rate Limit check
        const { success, limit, remaining } = await ratelimit.limit(ipIdentifier);

        // If exceeded
        if (!success) {
            return new Response(
                JSON.stringify({
                    error: "Rate limit exceeded",
                    details: "Please wait one minute before generating another schedule."
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "X-RateLimit-Limit": String(limit),
                        "X-RateLimit-Remaining": String(remaining),
                        // Add security headers to error response as well
                        "X-Frame-Options": "SAMEORIGIN",
                        "X-Content-Type-Options": "nosniff",
                    },
                }
            );
        }

        // Add rate limit info to success response headers
        response.headers.set("X-RateLimit-Limit", String(limit));
        response.headers.set("X-RateLimit-Remaining", String(remaining));
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
