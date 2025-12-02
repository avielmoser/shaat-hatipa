// app/api/generate-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildLaserSchedule } from "../../../lib/schedule-builder";
import { laserPrescriptionInputSchema } from "../../../lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // TODO: Implement proper rate limiting using @upstash/ratelimit and Redis.
    // The previous in-memory implementation was ineffective in serverless environments.

    const rawBody = await req.json().catch(() => null);

    if (!rawBody) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const validationResult = laserPrescriptionInputSchema.safeParse(rawBody);

    if (!validationResult.success) {
      // Format Zod errors into a readable string
      const errorMessage = (validationResult.error as any).errors
        .map((e: any) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");

      return NextResponse.json(
        { error: `Validation Error: ${errorMessage}` },
        { status: 400 }
      );
    }

    const input = validationResult.data;

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
