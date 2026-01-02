// app/api/generate-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { protocolScheduleInputSchema } from "@/domain/contracts/schemas";
import { validateRequest } from "@/lib/server/api-utils";
import { ImpossibleScheduleError } from "@/application/services/schedule.service";

export const runtime = "nodejs";

import { ConfigClinicRepository } from "@/infrastructure/config/config-clinic-repository";
import { ConsoleLogger } from "@/infrastructure/logging/console-logger";
import { ScheduleService } from "@/application/services/schedule.service";

export async function POST(req: NextRequest) {
  const clinicRepository = new ConfigClinicRepository();
  const loggerInstance = new ConsoleLogger();
  const scheduleService = new ScheduleService(clinicRepository, loggerInstance);

  try {
    const validation = await validateRequest(
      req,
      protocolScheduleInputSchema
    );

    if (!validation.success) {
      loggerInstance.warn("Validation failed", "API", { error: validation.response });
      return validation.response;
    }

    const result = await scheduleService.generate(validation.data as any);

    loggerInstance.info("Schedule generated successfully", "API", { protocol: validation.data.protocolKey });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    if (err instanceof ImpossibleScheduleError) {
      loggerInstance.warn("Impossible schedule requested", "API", { message: err.message });
      return NextResponse.json(
        { error: err.message, code: "IMPOSSIBLE_SCHEDULE" },
        { status: 422 }
      );
    }

    loggerInstance.error("generate-schedule error", "API", { error: err.message, stack: err.stack });

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? err.message : undefined
      },
      { status: 500 }
    );
  }
}
