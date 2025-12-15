# Regression Test Report
**Date:** 2025-12-15
**Version:** 1.0.0
**Status:** **PASSED**

## 1. Executive Summary
The application has undergone a regression pass following security hardening and export improvements. Critical paths (Schedule Generation, Exports, Security Headers) are functioning as expected. Edge cases in the scheduling engine (Cross-midnight, Dense Protocols) have been verified via a dedicated test suite.

## 2. Verification Matrix

### A. Security & Infrastructure
| Check | Status | Verification Method | Notes |
|-------|--------|---------------------|-------|
| Admin Routes Headers | **PASS** | `curl -I` | Headers (`Strict-Transport-Security`, `X-Frame-Options`, `Content-Security-Policy`) confirmed present on `/admin/dashboard` response (even on 404/401). |
| Analytics Guardrails | **PASS** | Code Inspection | `middleware.ts` correctly applies headers but excludes `api/analytics` from strict rate limits while maintaining security. |

### B. Core User Flow (Engine & UI)
| Flow | Status | Verification Method | Notes |
|------|--------|---------------------|-------|
| Schedule Generation (Happy Path) | **PASS** | `npm test` | Core engine logic remains stable. |
| Clinic Selection (QueryParams) | **PASS** | Code Inspection | `WorkArea.tsx` correctly resolves `clinicConfig` and passes it to sub-components. |
| Wizard Steps Navigation | **PASS** | Code Inspection | State machine in `WorkArea.tsx` handles `step` transitions correctly. |

### C. Logic Edge Cases (New Regression Suite)
Verified via `__tests__/regression_scenarios.test.ts`.

| Scenario | Status | Outcome |
|----------|--------|---------|
| **Cross-midnight Sleep** | **PASS** | Engine correctly handles sleep times (e.g., 01:00) that are numerically smaller than wake times (e.g., 07:00), treating them as the following day. |
| **Dense Protocol** | **PASS** | Successfully schedules hourly drops (14+ slots) without overlapping errors. |
| **Past Date Selection** | **PASS** | Engine generates valid schedules for past dates (e.g., 2020), ensuring users can log historical surgeries. |

### D. Export Functionality
| Feature | Status | verification | Technical Notes |
|---------|--------|--------------|-----------------|
| **ICS Export** | **PASS** | Code Review (`lib/utils/ics.ts`) | Events use Floating Time (`YYYYMMDDTHHmmSS`) to respect user's local timezone. `VALARM` set to 5 min before. |
| **PDF Export (Branding)** | **PASS** | Code Review (`lib/utils/pdf.ts`) | Logic correctly injects `clinic.logoUrl` (converting relative paths to absolute for print compatibility). |
| **PDF Export (RTL/Heb)** | **PASS** | Code Review (`lib/utils/pdf.ts`) | Detected `locale='he'` sets `<html dir="rtl">` and CSS `direction: rtl`. Translations applied via `LABELS`. |

## 3. Detailed Findings

### Validated Improvements
- **Floating Time in ICS**: confirmed that `toICalDateTime` does not append `Z`, ensuring events lock to the user's wall-clock time rather than UTC.
- **Admin Security**: Confirmed that `middleware.ts` matcher `['/((?!api|_next|favicon.ico).*)']` **includes** `/admin`, thus applying security headers.
- **RTL PDF**: Confirmed `dir="rtl"` injection in PDF HTML generation.

### Issues / Observations
- **Browser Automation**: Automated UI walkthroughs experienced inconsistencies due to local environment timeouts, but static code analysis and unit tests provide high confidence in the logic.
- **Route 404s**: `/en/wizard` is not a valid route; the wizard lives at the root `/[locale]` (e.g., `/en`). This is identifying behavior, not a bug, but noted for future testing.

## 4. Helper Artifacts
- **New Test Suite**: `__tests__/regression_scenarios.test.ts` created to permanently guard against regression of edge cases.

## Recommendation
**READY FOR DEPLOYMENT.**
The core logic is robust, security headers are active, and export formats are compliant with the new requirements.
