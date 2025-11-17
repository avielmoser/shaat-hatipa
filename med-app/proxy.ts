// proxy.ts
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

// 20 בקשות לדקה לכל IP
const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(20, "60s"),
      ephemeralCache: new Map(),
      analytics: true,
    })
  : null;

// 🔑 הפונקציה החדשה – במקום `middleware`
export async function proxy(request: NextRequest) {
  // מריץ Rate Limit רק על /api/generate-schedule
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
        },
      }
    );
  }

  // If ok → continue
  return NextResponse.next();
}


  // לכל שאר הבקשות – ממשיך רגיל
  return NextResponse.next();
}

// על איזה נתיבים ה-proxy רץ
export const config = {
  matcher: ["/api/generate-schedule"],
};
