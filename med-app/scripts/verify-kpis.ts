import { PrismaClient } from "@prisma/client";
import { getFunnelKPIs } from "../lib/server/analytics-kpis";

const prisma = new PrismaClient();

async function main() {
    console.log("--- Verifying KPI Logic ---");

    // Cleanup old test data if needed (optional, or just add new unique sessions)
    const now = new Date();
    const sessionIdA = `test-session-a-${now.getTime()}`;
    const sessionIdB = `test-session-b-${now.getTime()}`;
    const sessionIdC = `test-session-c-${now.getTime()}`;

    console.log("Creating 3 test sessions...");

    // Session A: Wizard + Schedule (Converted)
    await prisma.analyticsEvent.createMany({
        data: [
            { eventName: "wizard_viewed", sessionId: sessionIdA, createdAt: now },
            { eventName: "schedule_generated", sessionId: sessionIdA, createdAt: new Date(now.getTime() + 5000) }, // +5s
        ]
    });

    // Session B: Wizard only (Dropoff)
    await prisma.analyticsEvent.createMany({
        data: [
            { eventName: "wizard_viewed", sessionId: sessionIdB, createdAt: now },
        ]
    });

    // Session C: Wizard + Schedule (Converted)
    await prisma.analyticsEvent.createMany({
        data: [
            { eventName: "wizard_viewed", sessionId: sessionIdC, createdAt: now },
            { eventName: "schedule_generated", sessionId: sessionIdC, createdAt: new Date(now.getTime() + 120000) }, // +2m
        ]
    });

    console.log("inserted events. Fetching KPIs...");

    // Use a simple 7-day filter for verification
    const nowFilter = new Date();
    const filter = {
        createdAt: {
            gte: new Date(nowFilter.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
    };
    const kpis = await getFunnelKPIs(prisma, filter);
    console.log("Result:", kpis);

    // Expected: 
    // Conversion: 2/3 = 66.7%
    // Msg: "66.7%"

    // Avg Time:
    // A: 5s
    // C: 120s
    // Avg: 62.5s -> 1m 02s -> "01:02" (approx)

    console.log("Expected Conversion: ~66.7%");
    console.log("Expected Avg Time: ~01:02");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
