// app/api/generate-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildProtocolSchedule, ImpossibleScheduleError } from "@/lib/domain/schedule-builder";
import { protocolScheduleInputSchema } from "@/lib/domain/schemas";
import { resolveProtocol, resolveClinicConfig } from "@/lib/domain/protocol-resolver";
import { validateRequest } from "@/lib/server/api-utils";
import { logger } from "@/lib/utils/logger";
import { ProtocolScheduleInput } from "@/types/prescription";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // Rate limiting is handled in middleware.ts using @upstash/ratelimit

    const validation = await validateRequest(
      req,
      protocolScheduleInputSchema
    );

    if (!validation.success) {
      logger.warn("Validation failed", "API", { error: validation.response });
      return validation.response;
    }

    const inputData = validation.data;

    // Resolve Protocol Logic
    let medications = inputData.medications;
    let isAsNeeded = false;

    // If medications not provided, resolve strictly from config
    if (!medications || medications.length === 0) {
      try {
        const clinicConfig = resolveClinicConfig(inputData.clinicSlug);
        const protocol = resolveProtocol(clinicConfig, inputData.protocolKey);

        if (protocol.kind === "AS_NEEDED") {
          isAsNeeded = true;
        }
        medications = protocol.actions;
      } catch (resolverError: any) {
        // Strict error if protocol not found
        logger.warn("Protocol not found", "API", { key: inputData.protocolKey });
        return NextResponse.json(
          { error: resolverError.message || "Invalid Protocol", code: "INVALID_PROTOCOL" },
          { status: 400 }
        );
      }
    }

    // Construct full prescription input for engine/response
    const prescription: ProtocolScheduleInput = {
      clinicSlug: inputData.clinicSlug, // Validated property
      protocolKey: inputData.protocolKey,
      surgeryType: inputData.surgeryType, // Legacy pass-through
      surgeryDate: inputData.surgeryDate,
      wakeTime: inputData.wakeTime,
      sleepTime: inputData.sleepTime,
      medications: medications! // Asserted safe after resolution
    };

    if (isAsNeeded) {
      // Return empty schedule for As Needed, client handles instructions view
      logger.info("As Needed protocol requested", "API", { protocol: inputData.protocolKey });
      return NextResponse.json({
        prescription,
        schedule: [],
      });
    }

    // Use the unified scheduling logic
    const schedule = buildProtocolSchedule(prescription);

    logger.info("Schedule generated successfully", "API", { protocol: inputData.protocolKey });

    return NextResponse.json(
      {
        prescription,
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
