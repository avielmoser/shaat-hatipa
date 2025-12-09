import { NextResponse, type NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

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

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
    // 1. Rate Limit Logic
    let rateLimitResult = null;
    const isRateLimitedPath = request.nextUrl.pathname === "/api/generate-schedule" || request.nextUrl.pathname === "/api/analytics";

    if (isRateLimitedPath && ratelimit) {
        // Extract IP safely
        const ipHeader = request.headers.get("x-forwarded-for");
        const ipIdentifier = ipHeader?.split(",")[0].trim() || "127.0.0.1";

        // Rate Limit check
        rateLimitResult = await ratelimit.limit(ipIdentifier);

        // If exceeded
        if (!rateLimitResult.success) {
            return new Response(
                JSON.stringify({
                    error: "Rate limit exceeded",
                    details: "Please wait one minute before trying again."
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "X-RateLimit-Limit": String(rateLimitResult.limit),
                        "X-RateLimit-Remaining": String(rateLimitResult.remaining),
                        // Add security headers to error response as well
                        "X-Frame-Options": "SAMEORIGIN",
                        "X-Content-Type-Options": "nosniff",
                    },
                }
            );
        }
    }

    // 2. Handle i18n or API
    // If it's an API route, we don't use intlMiddleware (unless we want localized APIs)
    // For now, we skip intlMiddleware for /api
    let response: NextResponse;
    if (request.nextUrl.pathname.startsWith('/api')) {
        response = NextResponse.next();
    } else {
        response = intlMiddleware(request);
    }

    // 3. Add Security Headers
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: blob:;
        font-src 'self';
        object-src 'none';
        base-uri 'self';
        form-action 'self';
        frame-ancestors 'self';
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set("X-DNS-Prefetch-Control", "on");
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");

    // 4. Add rate limit info to success response headers if applicable
    if (rateLimitResult) {
        response.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
        response.headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining));
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
