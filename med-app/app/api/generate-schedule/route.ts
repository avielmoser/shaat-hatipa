// app/api/generate-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildLaserSchedule, ImpossibleScheduleError } from "../../../lib/schedule-builder";
import { laserPrescriptionInputSchema } from "../../../lib/schemas";
import { validateRequest } from "../../../lib/api-utils";
import { logger } from "../../../lib/logger";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting is handled in middleware.ts using @upstash/ratelimit

    const validation = await validateRequest(
      req,
      laserPrescriptionInputSchema
    );

    if (!validation.success) {
      logger.warn("Validation failed", "API", { error: validation.response });
      return validation.response;
    }

    const input = validation.data;

    // Use the unified scheduling logic
    const schedule = buildLaserSchedule(input);

    logger.info("Schedule generated successfully", "API", { surgeryType: input.surgeryType });

    return NextResponse.json(
      {
        prescription: input,
        schedule,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof ImpossibleScheduleError) {
      logger.warn("Impossible schedule requested", "API", { message: err.message });
      return NextResponse.json(
        { error: err.message, code: "IMPOSSIBLE_SCHEDULE" },
        { status: 422 }
      );
    }

    logger.error("generate-schedule error", "API", { error: err.message, stack: err.stack });

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? err.message : undefined
      },
      { status: 500 }
    );
  }
}
