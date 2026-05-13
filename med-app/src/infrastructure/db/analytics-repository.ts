import { prisma } from "@/lib/server/db";
import { Prisma } from "@prisma/client";

export interface CreateAnalyticsEventInput {
    eventName: string;
    eventType: "page_view" | "action" | "conversion";
    step?: string | null;
    buttonId?: string | null;
    sessionId?: string | null;
    clinicSlug?: string | null;
    meta?: Prisma.InputJsonValue;
}

export class AnalyticsRepository {
    /**
     * Persists an analytics event to the database.
     */
    async createEvent(data: CreateAnalyticsEventInput): Promise<void> {
        await prisma.analyticsEvent.create({
            data: {
                eventName: data.eventName,
                step: data.step ?? null,
                buttonId: data.buttonId ?? null,
                sessionId: data.sessionId ?? null,
                clinicSlug: data.clinicSlug ?? null,
                eventType: data.eventType,
                meta: data.meta ?? Prisma.JsonNull,
            },
        });
    }
}

export const analyticsRepository = new AnalyticsRepository();
