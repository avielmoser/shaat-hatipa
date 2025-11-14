// app/api/generate-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { LaserPrescriptionInput } from "../../../types/prescription";
import { buildLaserSchedule } from "../../../lib/schedule-builder";

export const runtime = "nodejs";

type SafeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/* ================== Rate Limiting בסיסי ================== */

// חלון זמן (מילישניות) וכמות בקשות מקסימלית לחלון
const RATE_WINDOW_MS = 60_000; // 60 שניות
const RATE_MAX_REQUESTS = 20; // עד 20 בקשות לדקה לאותו IP (מספיק לדמו)

// מפה גלובלית של IP → מידע על החלון הנוכחי
type RateInfo = {
  windowStart: number;
  count: number;
};

const rateMap = new Map<string, RateInfo>();

function getClientIp(req: NextRequest): string {
  // ב־Vercel לרוב משתמשים ב־x-forwarded-for
  const hdr = req.headers.get("x-forwarded-for");
  if (hdr) {
    return hdr.split(",")[0].trim();
  }
  // fallback – לא אידיאלי, אבל לדמו זה מספיק
  // @ts-ignore
  return (req.ip as string) || "unknown";
}

function checkRateLimit(req: NextRequest): boolean {
  const ip = getClientIp(req);
  const now = Date.now();

  const existing = rateMap.get(ip);

  if (!existing) {
    rateMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  const elapsed = now - existing.windowStart;

  if (elapsed > RATE_WINDOW_MS) {
    // חלון חדש
    rateMap.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (existing.count >= RATE_MAX_REQUESTS) {
    // עבר את הגבול בחלון הזמן
    return false;
  }

  existing.count += 1;
  rateMap.set(ip, existing);
  return true;
}

/* ================== ולידציה ================== */

function isValidTime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  return timeRegex.test(value);
}

function isValidDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const ts = Date.parse(value);
  return !Number.isNaN(ts);
}

function validateLaserInput(
  body: any
): SafeResult<LaserPrescriptionInput> {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "קלט לא חוקי" };
  }

  const { surgeryType, surgeryDate, wakeTime, sleepTime, medications } = body;

  if (surgeryType !== "INTERLASIK" && surgeryType !== "PRK") {
    return { ok: false, error: "סוג ניתוח לא תקין" };
  }

  if (!isValidDate(surgeryDate)) {
    return { ok: false, error: "תאריך הניתוח לא בפורמט תקין" };
  }

  if (!isValidTime(wakeTime) || !isValidTime(sleepTime)) {
    return { ok: false, error: "שעת קימה/שינה לא בפורמט תקין" };
  }

  if (!Array.isArray(medications) || medications.length === 0) {
    return { ok: false, error: "חייבת להיות לפחות תרופה אחת בפרוטוקול" };
  }

  for (const med of medications) {
    if (!med || typeof med !== "object") {
      return { ok: false, error: "מבנה תרופה לא תקין" };
    }

    if (typeof med.id !== "string" || !med.id.trim()) {
      return { ok: false, error: "תרופה ללא מזהה תקין" };
    }

    if (typeof med.name !== "string" || !med.name.trim()) {
      return { ok: false, error: "תרופה ללא שם תקין" };
    }

    if (!Array.isArray(med.phases) || med.phases.length === 0) {
      return { ok: false, error: "תרופה ללא פאזות מוגדרות" };
    }

    for (const phase of med.phases) {
      if (!phase || typeof phase !== "object") {
        return { ok: false, error: "פאזה לא תקינה בתרופה" };
      }

      const { dayStart, dayEnd, timesPerDay } = phase;

      if (
        typeof dayStart !== "number" ||
        typeof dayEnd !== "number" ||
        typeof timesPerDay !== "number"
      ) {
        return { ok: false, error: "ערכי פאזה חייבים להיות מספריים" };
      }

      if (
        !Number.isInteger(dayStart) ||
        !Number.isInteger(dayEnd) ||
        !Number.isInteger(timesPerDay)
      ) {
        return { ok: false, error: "ערכי פאזה חייבים להיות מספרים שלמים" };
      }

      if (dayStart < 1 || dayEnd < dayStart || dayEnd > 366) {
        return { ok: false, error: "טווח ימים לא תקין בפאזה" };
      }

      if (timesPerDay < 1 || timesPerDay > 24) {
        return { ok: false, error: "מספר הפעמים ביום לא תקין" };
      }
    }
  }

  const safe: LaserPrescriptionInput = {
    surgeryType,
    surgeryDate,
    wakeTime,
    sleepTime,
    medications,
  };

  return { ok: true, data: safe };
}

/* ================== Handler ================== */

export async function POST(req: NextRequest) {
  try {
    // בדיקת Rate Limit לפני כל דבר אחר
    const allowed = checkRateLimit(req);
    if (!allowed) {
      return NextResponse.json(
        {
          error:
            "נשלחו יותר מדי בקשות בזמן קצר. אנא המתן רגע ונסה שוב.",
        },
        { status: 429 }
      );
    }

    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return NextResponse.json(
        { error: "הנתונים שנשלחו אינם תקינים. נסה שוב." },
        { status: 400 }
      );
    }

    const validated = validateLaserInput(rawBody);

    if (!validated.ok) {
      return NextResponse.json(
        {
          error:
            validated.error ||
            "הנתונים שנשלחו אינם בפורמט תקין. בדוק את הערכים ונסה שוב.",
        },
        { status: 400 }
      );
    }

    const input = validated.data;

    // שימוש בלוגיקה הקיימת לחישוב לוח הזמנים
    const schedule = buildLaserSchedule(input);

    return NextResponse.json(
      {
        prescription: input,
        schedule,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("generate-schedule error", err);

    return NextResponse.json(
      {
        error:
          "משהו השתבש בצד השרת. אם זה חוזר על עצמו, נסה שוב מאוחר יותר או פנה לתמיכה.",
      },
      { status: 500 }
    );
  }
}
