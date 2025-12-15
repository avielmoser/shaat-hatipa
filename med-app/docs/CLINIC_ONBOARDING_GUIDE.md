# Clinic Onboarding Guide

> **NON-NEGOTIABLE CONTRACT**
> This document serves as the absolute source of truth for onboarding new clinics. 
> Adherence to these guidelines is mandatory. Deviations will be rejected during code review.

## 1. Title & Purpose

**Purpose:** This guide defines the strict process for onboarding a new clinic to the Protocol Scheduling Engine. It establishes the architectural boundary between the **Platform** (the scheduling engine) and the **Clinic** (configuration).

**Who Must Read This:** Any developer tasked with adding a NEW clinic or modifying an EXISTING clinic's medical logic.

**Why This Exists:** To prevent architectural drift. The engine is a domain-agnostic calculator. It does not know about "Eye Drops", "Physical Therapy", or "Dental Aligners". It only knows about `TreatmentActions` distributed over time. All medical context must reside strictly within the clinic configuration.

---

## 2. Core Platform Principle

### "A clinic is configuration, not code."

There is a hard separation of responsibility:

*   **The Clinic** defines the **Medical Truth** (What actions, when, how often, what they are called).
*   **The Platform** ensures **Time Correctness** (Collision resolution, wake/sleep windows, calendar generation).

You must **NEVER** modify the scheduling engine logic to accommodate a specific clinic's requirement. If the engine cannot support a clinic's protocol, it is a Platform level issue, not a Clinic Onboarding issue (see Section 10).

---

## 3. High-Level Onboarding Flow

1.  **Define** the clinic's branding and copy assets (Colors, Logos, localized Strings).
2.  **Create** valid `TreatmentAction` definitions for all required protocols.
3.  **Implement** the `ClinicConfig` file in `config/clinics/`.
4.  **Register** the clinic in `config/clinics/index.ts`.
5.  **Verify** the generated schedule locally using the test harness or UI.

---

## 4. Creating a Clinic Configuration

New clinics live in: `med-app/config/clinics/<clinic-slug>.ts`

**Naming Rule:** The file name must match the URL slug (kebab-case). The exported constant should be camelCase.

### Example Clinic Configuration

```typescript
import { ClinicConfig } from "./types";
import { TreatmentAction } from "../../types/prescription";

export const dentalCareClinic: ClinicConfig = {
    id: "dental-plus",
    slug: "dental-plus", // Uniquely identifies the clinic in URLs
    name: "Dental Plus",
    logoUrl: "/logos/dental-plus.png",

    // Branding & Theming
    colors: {
        primary: "#1e3a8a",   // Brand Primary
        secondary: "#eff6ff", // Light Background
        button: "#2563eb",    // Primary Action Button
        text: "#0f172a"       // Standard Text
    },

    // Localization
    copy: {
        en: {
            heroTitle: "Aligner Schedule",
            heroSubtitle: "Track your daily aligner changes",
            actionLabel: "Action"
        },
        he: {
            heroTitle: "לוח זמנים ליישור שיניים",
            heroSubtitle: "עקוב אחרי החלפת הקשתיות היומית",
            actionLabel: "פעולה"
        }
    },

    // Protocols & Logic
    supportedProcedures: ["CUSTOM"], // ProcedureType
    defaultActionDuration: 10, // Default minutes per action if not specified on TreatmentAction
    
    protocols: {
        CUSTOM: [
            {
                id: "aligner-change",
                name: "Change Aligner",
                frequencyPerDay: 1, // Simplified onboarding structure
                minDurationMinutes: 15
            }
        ]
    }
};
```

> Note: Branding and localization fields have no impact on scheduling logic.
> Only TreatmentActions and protocol definitions affect time calculation.

---

## 5. Defining TreatmentActions

The **TreatmentAction** is the canonical atomic unit of the medical protocol.

The engine processes these actions blindly. It does not care if the action is "Instill Drops", "Walk 100 meters", or "Drink Water".

In the codebase, TreatmentAction is implemented as ProtocolAction for backward compatibility.

### Required Fields
*   **`id`** *(string)*: Unique internal identifier for the action (e.g., `pred-forte`, `ice-pack`).
*   **`name`** *(string)*: Human-readable label displayed to the patient (e.g., "Pred Forte", "Ice").
*   **`frequencyPerDay`** *(number)*: How many times per day this happens.

### Optional Fields
*   **`minDurationMinutes`** *(number)*: The mandatory time block this action consumes. 
    *   **CRITICAL:** If omitted, the engine uses the clinic's `defaultActionDuration`.
    *   Use this to define spacing (e.g., "Wait 5 minutes").
*   **`notes`** *(string)*: Instructions shown to the patient.

---

## 6. Registering the Clinic

A clinic is not active until registered in the central registry.

**File:** `med-app/config/clinics/index.ts`

**Why:** This registry is the authoritative dictionary mapping URL slugs to Configurations.

### Registration Code

```typescript
import { dentalCareClinic } from "./dental-plus";

const CLINICS: Record<string, ClinicConfig> = {
    // ... existing clinics
    [dentalCareClinic.slug]: dentalCareClinic,
};
```

---

## 7. Validation & Safety Rules

The engine treats configuration as law.

1.  **Unique IDs:** Every `TreatmentAction` within a protocol MUST have a unique `id`. Duplicate IDs will cause rendering collisions.
2.  **Valid Phase Ranges:** Day ranges must be valid relative to procedure start.
3.  **Duration Safety:** If `defaultActionDuration` is undefined in the config, AND a `TreatmentAction` lacks `minDurationMinutes`, the engine may default to safety fallbacks (or throw). **Always define a clinic-level default.**
4.  **No Collisions:** The engine resolves collisions, but extremely high-frequency requirements (>10 times/day) with long durations may overflow the awake window. 

**If a schedule fails to generate:**
Check that the total duration of actions does not exceed the available `awakeMinutes` in the day. The platform assumes a physical limit to how many actions fit in a day.

---

## 8. Testing a New Clinic

Before submitting a PR, you MUST manually verify the clinic.

**Local Checklist:**
1.  Run the app locally (`npm run dev`).
2.  Navigate to `/?clinic=<your-slug>`.
3.  **Verify Branding:** Are the logo and colors correct?
4.  **Verify Labels:** Do the strings match the `copy` config (check both English and Hebrew)?
5.  **Generate Schedule:** Enter dummy procedure options and generate a schedule.
6.  **Scan the Timeline:**
    *   Are the action names correct? (e.g., "Change Aligner" vs "Drops")
    *   Are the time intervals logical?
    *   Are the instructions clear?
7.  **Red Flags:** Seeing "Drops" anywhere in the UI for a non-drop clinic means you failed to configure `actionLabel` or generic terms.

---

## 9. Common Anti-Patterns (Explicitly Forbidden)

*   **⛔ Hardcoding Labels:** Do NOT write "Drops" or "Eye" in components. Use the configured `actionLabel` or generic strings.
*   **⛔ Engine Edits:** Do NOT add `if (clinic === 'dental')` statements inside `schedule-builder.ts`.
*   **⛔ Medical Logic in Components:** Do NOT put dosage rules in the UI. All dosage rules belong in the `protocols` function in the config.
*   **⛔ Bypassing Validation:** Do NOT cast types to `any` to force invalid protocol structures.

---

## 10. When Engine Changes Are Allowed

Changing the Core Engine (`schedule-builder.ts` or generic types) is a **Major Platform Change**.

It is acceptable **ONLY** if:
1.  A bug is discovered that affects ALL clinics (e.g., time zone calculation error).
2.  A new **universal** capability is required (e.g., "Nightly Actions").

**Approval:**
Matches to the engine require approval from the Platform Lead. "My clinic needs this" is not a valid justification for an engine change unless the requirement is generalized into a domain-agnostic feature.

---

## 11. Final Summary

*   Clinics are **Data**.
*   The Engine is **Logic**.
*   **TreatmentAction** is the unit of work.
*   Integrity depends on strict separation.

Follow this guide, and you will ensure the platform remains scalable, stable, and domain-agnostic.
