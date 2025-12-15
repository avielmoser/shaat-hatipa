# Admin Dashboard Analytics Troubleshooting

This guide explains how to troubleshoot and fix issues with the Analytics Dashboard in production (Vercel + Neon).

## Quick Config Check

The dashboard requires these environment variables in Vercel:

- `DATABASE_URL`: Connection string to Neon Postgres (Pooled or Direct).
- `ADMIN_DASHBOARD_KEY`: A secret key to access the dashboard.

## Common Issues

### 1. "Database configuration missing"
**Symptom:** Red banner says "Database configuration missing".
**Fix:** Ensure `DATABASE_URL` is set in Vercel Project Settings for the **Production** environment.

### 2. "Error fetching analytics data"
**Symptom:** Red banner appears. Cards show 0.
**Logs:** check Vercel logs for `[AdminDashboard] Database Fetch Error`.
**Fixes:**
- **Runtime:** We now force `runtime = "nodejs"` in `page.tsx`. If this was accidentally removed, Prisma Client may fail in Edge Runtime.
- **Migration:** Ensure the production database has the `eventType` column. Run `npx prisma migrate deploy` if in doubt.

### 3. Missing Data / "0" results
**Symptom:** Dashboard loads but shows 0 events, even though you know events exist.
**Cause:**
- **Filtering:** The dashboard defaults to "Meaningful" view (Page Views + Conversions). If your events are "clicks" or other types, switch to **View: ALL**.
- **Clinic Filter:** Ensure the correct clinic is selected (or "All Clinics").
- **Date Range:** Check if the events are within the selected date range.

## Engineering Notes

### Schema & Querying
The dashboard uses a dedicated column `eventType` (String) for filtering meaningful events.
- **Old way:** JSON path query on `meta->'eventType'`. (Unreliable on some providers/runtimes).
- **New way:** Direct column query `where: { eventType: { in: [...] } }`.

### Ingestion
The `/api/analytics` endpoint writes to **both**:
1. `meta` JSON (for full payload history)
2. `eventType` column (for performant querying)

If you need to query a new field efficiently in the dashboard, consider promoting it to a top-level column in `AnalyticsEvent`.
