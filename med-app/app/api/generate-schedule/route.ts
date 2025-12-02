// app/api/generate-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildLaserSchedule } from "../../../lib/schedule-builder";
import { laserPrescriptionInputSchema } from "../../../lib/schemas";
import { validateRequest } from "../../../lib/api-utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting is handled in middleware.ts using @upstash/ratelimit

    const validation = await validateRequest(
      req,
      laserPrescriptionInputSchema
    );

    if (!validation.success) {
      return validation.response;
    }

    const input = validation.data;

    // Use the unified scheduling logic
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
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
