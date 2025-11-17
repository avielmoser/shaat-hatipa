// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check for environment variables (Rate limiting will be disabled if missing)
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
  // Production warning: This should be configured in Vercel environment variables.
  console.warn("UPSTASH Redis credentials missing. Rate limiting is DISABLED.");
}

// Initialize Upstash Redis and Ratelimit only if credentials exist
const redis = (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: UPSTASH_REDIS_REST_URL,
      token: UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// הגדרת מגבלת קצב: 20 בקשות לכתובת IP ב-60 שניות
const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.fixedWindow(20, "60s"), 
      ephemeralCache: new Map(), 
      analytics: true,
    })
  : null;


export async function middleware(request: NextRequest) {
  // מפעיל את ה-Rate Limiting רק על נתיב יצירת לוח הזמנים
  if (request.nextUrl.pathname === '/api/generate-schedule' && ratelimit) {
    
    // **תיקון TypeScript לשגיאת ה-IP:** מכריח את הסוג לכלול את מאפיין ה-IP
    const reqWithIp = request as NextRequest & { ip: string };
    
    // מזהה משתמש לפי כתובת IP
    const ipIdentifier = reqWithIp.ip ?? '127.0.0.1';

    // בדיקת מגבלת הקצב
    const { success, limit, remaining } = await ratelimit.limit(ipIdentifier);

    // הגדרת מענה (Response)
    const response = success
        ? NextResponse.next()
        : NextResponse.json(
            {
                error: "Rate limit exceeded. Too many requests.",
                details: "Please wait a minute before generating another schedule."
            },
            { status: 429 } // HTTP 429: Too Many Requests
        );

    // הוספת כותרי Rate Limit לתגובה
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    
    // אם המגבלה עברה, החזרת תגובת 429
    if (!success) {
        return response;
    }
    
    // אם הכל תקין, המשך ל-API
    return NextResponse.next();
  }

  // המשך לכל שאר הבקשות ללא הגבלה
  return NextResponse.next();
}

// קונפיגורציה המגדירה לאילו נתיבים ה-middleware ירוץ
export const config = {
  matcher: ['/api/generate-schedule'],
};