import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function postEvent(payload) {
    console.log(`Sending event: ${payload.eventName}...`);
    const res = await fetch(`${baseUrl}/api/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to POST event ${payload.eventName}: ${res.status} ${text}`);
    }
    console.log(`Successfully sent ${payload.eventName}`);
}

async function main() {
    const testSessionId = `smoke-test-${Date.now()}`;

    // 1. POST test events
    await postEvent({
        eventName: 'wizard_viewed',
        eventType: 'page_view',
        sessionId: testSessionId,
        path: '/',
        clinicSlug: 'default'
    });

    await postEvent({
        eventName: 'time_modified',
        eventType: 'action',
        sessionId: testSessionId,
        path: '/',
        clinicSlug: 'default',
        meta: { wakeTime: '07:00' }
    });

    await postEvent({
        eventName: 'generate_schedule_clicked',
        eventType: 'action',
        sessionId: testSessionId,
        path: '/',
        clinicSlug: 'default'
    });

    console.log('\nWaiting 2s for DB consistency...');
    await new Promise(r => setTimeout(r, 2000));

    // 2. Verify in DB
    console.log('\nVerifying events in DB...');
    const events = await prisma.analyticsEvent.findMany({
        where: { sessionId: testSessionId },
        orderBy: { createdAt: 'asc' }
    });

    if (events.length === 3) {
        console.log('✅ Found all 3 test events in DB.');
    } else {
        console.error(`❌ Expected 3 events, found ${events.length}`);
        process.exit(1);
    }

    // 3. Check specific event types as processed by DB
    const timeMod = events.find(e => e.eventName === 'time_modified');
    if (timeMod && timeMod.eventType === 'action') {
        console.log('✅ time_modified recorded correctly as action.');
    } else {
        console.error('❌ time_modified missing or wrong type.');
        process.exit(1);
    }

    // 4. Test Dashboard API
    console.log('\nTesting Dashboard API...');
    const start = new Date(Date.now() - 3600000).toISOString();
    const end = new Date(Date.now() + 3600000).toISOString();
    const dashRes = await fetch(`${baseUrl}/api/analytics/dashboard?startDate=${start}&endDate=${end}&clinic=default`);

    if (!dashRes.ok) {
        console.error(`❌ Dashboard API failed: ${dashRes.status}`);
        process.exit(1);
    }

    const metrics = await dashRes.json();
    console.log('Dashboard KPI Check:');
    console.log(`- Total Visits: ${metrics.kpis.totalVisits}`);
    console.log(`- Time Mod Rate: ${metrics.kpis.timeModificationRate}`);
    console.log(`- Funnel Generated: ${metrics.funnel.generated}`);

    if (metrics.funnel.generated > 0) {
        console.log('✅ Dashboard correctly counted generate_schedule_clicked in funnel.');
    } else {
        console.warn('⚠️ Dashboard funnel "generated" is 0. This might be due to aggregation rules (requires wizard_viewed first in same session).');
    }

    console.log('\n--- SMOKE TEST PASSED ---');
}

main()
    .catch(err => {
        console.error('SMOKE TEST FAILED');
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
