# Environment Setup & Database Safety

This project enforces strict separation between **Development** and **Production** databases. Local development is blocked if it attempts to connect to a Production database host.

## 1. Local Development Setup

To run the app locally, you MUST point to a development Neon branch or a local Postgres instance.

1.  **Create `.env.local`** (if not exists):
    ```bash
    cp .env.example .env.local
    ```
2.  **Set connection string**:
    In `.env.local`, set `DATABASE_URL` to your **Neon Development Branch** URL.
    ```env
    # .env.local
    DATABASE_URL="postgres://user:pass@ep-cool-dev-123.aws.neon.tech/neondb?sslmode=require"
    
    # Optional: Explicitly safe-list specific Prod hosts to block (if defaults aren't enough)
    # PROD_DB_HOSTS="ep-prod-host.aws.neon.tech,neondb-prod"
    ```
    *Note: `lib/db.ts` will block connection if the hostname matches known production patterns while in development mode.*

3.  **Run Migrations**:
    Apply schema changes to your development branch:
    ```bash
    npx prisma migrate dev
    ```

4.  **Start App**:
    ```bash
    npm run dev
    ```
    *Open [http://localhost:3000](http://localhost:3000)*.

## 2. Verification

### Confirming Environment Separation

1.  **Check Dashboard Badge**:
    - Go to `/admin/dashboard`.
    - You should see a **"LOCAL DEV DATA"** badge.
    - If you see "PRODUCTION DATA", stop immediately—you are connected to Production!

2.  **Verify Analytics Writes**:
    - Trigger an event (e.g., click a button).
    - Check your terminal logs. You should see:
      `[Analytics] Writing event '...' to DB host: ep-cool-dev-123...`

3.  **SQL Verification**:
    Connect to your **Development DB** (using a tool or `psql`) and run:
    ```sql
    -- Check event count
    SELECT COUNT(*) FROM analytics_events;
    
    -- See recent events (ensure they match what you just did)
    SELECT event_name, created_at FROM analytics_events ORDER BY created_at DESC LIMIT 5;
    ```
    Then connect to **Production DB** and verify the new test events are **NOT** there.

## 3. Common Issues

### App Crashes with "SAFETY: blocked connection..."
- **Cause**: Your `DATABASE_URL` in `.env.local` points to a Production host.
- **Fix**: Change `DATABASE_URL` to the Neon Development branch URL.

### `.next/dev/lock` Error
If `npm run dev` fails with a lockfile error:
```bash
rm -rf .next/dev/lock
# or
rm -rf .next
npm run dev
```

### Admin Dashboard 404
- Ensure you have `ADMIN_DASHBOARD_KEY` set in `.env.local`.
- Visit `/admin/dashboard?key=YOUR_KEY`.
