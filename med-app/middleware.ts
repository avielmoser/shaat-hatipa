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
    // 1. Negative lookahead for api, _next, static files, favicon
    // 2. Matches everything else
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

