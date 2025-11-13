// app/api/generate-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildLaserSchedule } from "../../../lib/schedule-builder";
import type {
  LaserPrescriptionInput,
  LaserScheduleResponse,
} from "../../../types/prescription";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LaserPrescriptionInput;

    if (!body.surgeryDate || !body.wakeTime || !body.sleepTime) {
      return NextResponse.json(
        { error: "Missing required fields (surgeryDate, wakeTime, sleepTime)" },
        { status: 400 }
      );
    }

    if (!body.medications || body.medications.length === 0) {
      return NextResponse.json(
        { error: "At least one medication is required" },
        { status: 400 }
      );
    }

    const schedule = buildLaserSchedule(body);

    const response: LaserScheduleResponse = {
      prescription: body,
      schedule,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    console.error("Error generating laser schedule:", err);
    return NextResponse.json(
      { error: "Failed to generate schedule" },
      { status: 500 }
    );
  }
}
