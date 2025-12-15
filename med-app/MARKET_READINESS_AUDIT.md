# MARKET READINESS AUDIT

## A) Executive Verdict
**Verdict:** CONDITIONAL GO for Pilot (1 clinic) | NO-GO for Scale (10 clinics).

The core engine is medically sound and the UI patterns are strong, but the **Security posture** and **Export functionality** have critical defects that make it unsafe for wider rollout. The Admin panel is currently exposed without security headers, and the PDF/ICS exports are unusable for Israeli patients (wrong timezones, forced LTR).

**Top 3 Risks:**
1.  **Security Bypass:** `middleware.ts` configuration excludes `/admin` from security headers and rate limiting, leaving the most sensitive area vulnerable.
2.  **Export Failure:** ICS files force UTC (shifting times by 2-3h), and PDF exports lack RTL support/branding, making them practically useless for patients.
3.  **Scheduling Fragility:** "Every hour" protocols rely on "even distribution" math that may drift or clump with rounding, leading to confusing schedules for dense protocols.

---

## B) Scorecard

| Category | Score (0-10) | Evidence |
| :--- | :---: | :--- |
| **UX & Clarity** | **8/10** | Strong "Wizard" flow, clear mobile instructions (`SurgeryForm.tsx`). `ScheduleDisplay` is clean. |
| **Mobile & RTL/LTR** | **6/10** | UI handles RTL well, but **PDF export fails completely** (forced LTR). Time inputs force LTR alignment. |
| **Scheduling Correctness** | **7/10** | Logic handles midnight crossing (`isWithinAwakeWindow`), but collision resolution is messy for dense schedules. |
| **Export Quality** | **2/10** | **Critical Fail**. ICS shifts time (UTC bug). PDF is unbranded, LTR-only, and lacks clinic logo. |
| **Security & Privacy** | **4/10** | `analytics` validates types, but `middleware` matcher **excludes admin** from protection. No PII scrubbing validation. |
| **Performance** | **9/10** | Lightweight stack (Next.js, no heavy CSS-in-JS). `framer-motion` is the only heavy dep. |
| **Accessibility** | **7/10** | Good semantic HTML (`<label>`, `aria-pressed`), but some inputs rely on placeholder/helper text context. |
| **Maintainability** | **8/10** | Clean structure (`lib/domain`, `components`). `protocols.ts` is centralized. Code is readable. |
| **Observability** | **5/10** | Analytics exist but log to DB without external error monitoring (Sentry/LogRocket). Logs are local-only. |
| **Overall Readiness** | **6/10** | **Not ready for scale.** Must fix exports and middleware before first real patient. |

---

## C) End-to-End Walkthrough Findings

| Step | Status | Findings | Severity | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Landing** | ✅ Works | Clean hero, clear value prop. | - | `HeroSection.tsx` |
| **Input (Step 1)** | ⚠️ Issues | Date input allows **past dates** (e.g., 2022) with no warning. | P2 | `SurgeryForm.tsx` |
| **Protocol Selection** | ✅ Works | Defaults to INTERLASIK/PRK if clinic config missing. Resilient. | - | `SurgeryForm.tsx` |
| **Schedule View** | ✅ Works | Cards are clear. Chips use transparency. | - | `ScheduleView.tsx` |
| **Export PDF** | ❌ **BROKEN** | Forces English/LTR. Ignores Clinic Logo. | **P0** | `lib/utils/pdf.ts:58` |
| **Export ICS** | ❌ **BROKEN** | Shifts times by timezone offset (forces UTC `Z`). | **P0** | `lib/utils/ics.ts:40` |

---

## D) Critical Bugs & Blockers (P0)

### 1. Security Headers Missing on Admin
- **Repro:** Inspect headers on `/admin/dashboard`.
- **Expected:** `X-Frame-Options`, `Strict-Transport-Security`, etc.
- **Actual:** None.
- **Root Cause:** `middleware.ts` matcher `matcher: ['/((?!api|admin|_next|favicon.ico).*)']` explicitly **excludes** admin from running the middleware.
- **Fix:** Remove `admin` from negative lookahead in matcher. Use conditional logic inside middleware to skip *i18n* only, but keep headers.
- **File:** `middleware.ts`

### 2. ICS Export Shifts Time
- **Repro:** Generate schedule for 08:00. Download ICS. Import to Google Calendar (TLV).
- **Expected:** Event at 08:00.
- **Actual:** Event at 10:00 or 11:00 (depending on DST).
- **Root Cause:** `toICalDateTime` appends `Z` (UTC) to constructing a Date object from local strings.
- **Fix:** Remove `Z` and use floating time (local) for medication reminders.
- **File:** `lib/utils/ics.ts`

### 3. PDF Export is Anglicized
- **Repro:** Switch app to Hebrew. Generate Schedule. Click Print.
- **Expected:** Hebrew headers, RTL layout, Clinic Logo.
- **Actual:** English headers ("Time", "Notes"), LTR layout, No logo.
- **Root Cause:** Hardcoded strings and `<html dir="ltr">` in `buildPrintableHtml`.
- **Fix:** Pass `locale` and `t` (translations) to `buildPrintableHtml`. Inject Clinic Logo from config.
- **File:** `lib/utils/pdf.ts`

---

## E) High-Impact Improvements (P1)

1.  **Strict Date Validation** (Product/Frontend): Prevent selecting past dates in `SurgeryForm`. (Effort: S, `SurgeryForm.tsx`)
2.  **Clinic Logo in PDF** (Product): Essential for clinic trust. (Effort: M, `lib/utils/pdf.ts`)
3.  **RTL in PDF** (Frontend): Essential for readability. (Effort: M, `lib/utils/pdf.ts`)
4.  **Admin Auth Hardening** (Backend): Ensure `/admin` is actually protected by session/auth, currently relies on simple middleware checks that might be bypassed if middleware doesn't run. (Effort: M, `middleware.ts`)
5.  **Error Monitoring** (DevEx): Add Sentry. Analytics writing to DB is fragile; if DB is down, we lose visibility. (Effort: S, `package.json`)
6.  **"Hourly" Protocol Definition** (Domain): Define "Hourly" explicitly rather than `awake / 60`. Current logic drifts. (Effort: M, `protocols.ts`)
7.  **Rate Limit Feedback** (UX): Show user "Too many requests" formatted message instead of JSON dump. (Effort: S, `middleware.ts`)
8.  **Collision Visualization** (UX): If 2 drops are at 10:00, ensure visual stacking is clear. (Effort: M, `ScheduleDisplay.tsx`)
9.  **Time Input Alignment** (UX): Fix `dir="ltr"` on time inputs in RTL mode being jarring. (Effort: S, `SurgeryForm.tsx`)
10. **Test Coverage**: Add unit tests for `getInterlasikMedications` logic. (Effort: M, `__tests__`)

---

## F) Security/Privacy Audit

-   **Data Storage:** Analytics data stored in Postgres (`AnalyticsEvent`).
-   **PII/PHI Risks:**
    -   `meta` field in analytics is unstructured JSON. Logging "Surgery Type" or "Medication Name" alongside `sessionId` creates a permanent PHI record.
    -   **Recommendation:** Do not log inputs in `meta`. Only log "Step Completed". Scrub `sessionId` periodically.
-   **Rate Limiting:** Active (20/min). Good protection against DoS on generation API.
-   **Injection:** `pdf.ts` uses `escapeHtml`. `db.ts` uses Prisma (parameterized queries). Low risk.
-   **Compliance:** No cookie banner. Analytics are strictly first-party, but GDPR requires consent if tracking unique sessions.

---

## G) Performance Audit

-   **Bundle Size:** `framer-motion` (v12) is large. Ensure it's tree-shaken or lazy loaded.
-   **Render:** `ScheduleView` renders hundreds of slots. Virtualization is not used, but for ~30 days (100-200 items) it's acceptable.
-   **Slow Path:** `schedule-builder.ts` collision resolution loop (up to 12 steps * 16 hours). For very dense schedules, this could block the main thread (node) or client.
-   **Client JS:** `useClient` is used appropriately. `SurgeryForm` is client-side. Server limits are respected.

---

## H) Accessibility Audit

-   **Quick Wins:**
    -   Ensure `aria-invalid` on all invalid inputs (Present in `SurgeryForm`).
    -   Add `alt` text to Clinic Logo (Config check).
-   **Medical Grade:**
    -   Contrast: `text-slate-500` on white is accessible (AA).
    -   Screen Reader: Test `ScheduleDisplay` with VoiceOver. The table structure in PDF is good. The React view needs `role="listitem"` or similar.

---

## I) Release Gate Checklist (Pilot)

- [ ] **FIX P0:** Enable Security Headers for Admin (`middleware.ts`)
- [ ] **FIX P0:** Fix ICS Timezone Shift (`ics.ts`)
- [ ] **FIX P0:** Enable RTL in PDF Export (`pdf.ts`)
- [ ] **FIX P0:** Add Clinic Logo to Print (`pdf.ts`)
- [ ] **VERIFY:** Analytics ignores Admin traffic
- [ ] **VERIFY:** Rate limiting works (manual test)
- [ ] **TEST:** Generate schedule for "Sleeping 01:00, Waking 07:00" (Cross-midnight)
- [ ] **TEST:** Generate schedule for "Interlasik" (Hourly)
- [ ] **UX:** Block past dates in Date Picker
- [ ] **LEGAL:** Add Terms/Privacy link to footer
- [ ] **OPS:** Verify Database Backups (Neon)
- [ ] **OPS:** Set `PROD_DB_HOSTS` env var

---

## J) Next Sprint Plan (7 Days)

**Goal: Fix P0s and Deploy for Pilot**

1.  **Day 1 (Security):** Fix `middleware.ts` matcher. Verify headers on `/admin`. Add basic Auth check (Environment Secret).
2.  **Day 2 (Exports):** Rewrite `ics.ts` to use floating time. Rewrite `pdf.ts` to accept `locale` and `logoUrl`.
3.  **Day 3 (Frontend):** Implement `dir` switching in PDF generator. Add Clinic Logo to `ein-tal.ts` config and pass to print function.
4.  **Day 4 (Validation):** Update `SurgeryForm` logic to default to Today and block past dates.
5.  **Day 5 (QA):** Manual regression testing of all protocols. Test with Hebrew/English locale.
6.  **Day 6 (Ops):** Set up Sentry. Verify production build.
7.  **Day 7 (Pilot):** Deploy to Vercel. Send link to Clinic Manager.
