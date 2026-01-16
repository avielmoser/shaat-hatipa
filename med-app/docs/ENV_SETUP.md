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

1.  **Check Logs on Startup**:
    - When you run `npm run dev`, look for the line:
      `[ENV CHECK] env=development db_host=... expected=dev`

2.  **Safety Test (Fail Fast)**:
    - Temporarily change your `.env.local`:
      ```env
      # Simulate a production host config
      DATABASE_URL="postgres://neondb_owner:pass@ep-misty-feather-agshpgmp-pooler.c-2.eu-central-1.aws.neon.tech/neondb"
      ```
    - Run `npm run dev`.
    - **Result**: The app should **CRASH** immediately with:
      `FATAL: Environment is connected to the wrong database.`

3.  **Production Verification**:
    - Ensure your Vercel Production environment variables include:
      - `NODE_ENV`: `production`
      - `DATABASE_URL`: Must match `ep-misty-feather-agshpgmp-pooler.c-2.eu-central-1.aws.neon.tech`.
    - Any other hostname in Production will trigger a fatal error.

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