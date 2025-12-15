# Admin Security Verification

This guide validates that security headers are correctly applied to `/admin` routes after the middleware update.

## 1. Prerequisites
- Ensure the application is running locally:
  ```bash
  npm run dev
  ```
  *(Expected URL: http://localhost:3000)*

## 2. Verification Steps

### Step 1: Check Security Headers
Run the following command in a separate terminal window:

```bash
curl -I http://localhost:3000/admin
```

**Expected Output:**
Look for these specific headers in the response:

```http
HTTP/1.1 200 OK  (or 307/401 depending on auth state)
...
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
...
```

### Step 2: Verify i18n Bypass
Confirm that `/admin` is **NOT** redirecting to `/en/admin` or `/he/admin`.

```bash
curl -I http://localhost:3000/admin
```
- **Pass**: Returns status `200`, `401`, or a redirect to `/login` (without locale prefix).
- **Fail**: Returns status `307 Temporary Redirect` to `/en/admin/...` or `/he/admin/...`.

## 3. Note on Rate Limiting
The current configuration **excludes** `/admin` from the rate limiter logic in `middleware.ts`.
- `isRateLimitedPath` checks only for `/api/generate-schedule` and `/api/analytics`.
- This is intentional to prevent admins from being locked out, but implies admins rely on standard authentication security.
