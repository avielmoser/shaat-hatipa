# Historical: Engine Refactor & Domain Agnostic Audit
> **STATUS: HISTORICAL**
>
> **DATE: December 2025**
>
> This document records the architectural transition from a single-vertical "Laser Eye Surgery" scheduler to a domain-agnostic "Medical Protocol Engine". It preserves the findings of the initial audit and the subsequent refactoring actions. It is kept for historical context and to explain *why* certain abstractions exist.

---

## Part 1: The Problem (Pre-Refactor Audit)

### Context
In late 2025, an audit revealed that the codebase was heavily coupled to the domain of ophthalmology and laser eye surgery, preventing expansion into other verticals like Orthopedics or Dentistry.

### Critical Findings
The audit identified three categories of coupling:

#### 1. Terminology Coupling
The system used domain-specific names in core types, limiting semantic usage.
- `LaserPrescriptionInput` -> Implied only laser inputs.
- `SurgeryType` -> Implied only surgeries (not physio/dental).
- `buildLaserSchedule` -> Function name explicitly mentioned laser.
- `resolveMedicationCollisions` -> Implied solution only for medications.

#### 2. Logic Coupling (The "5-Minute Heuristic")
The scheduling engine contained a hardcoded safety check:
> Throws `ImpossibleScheduleError` if `(totalDrops * 5) > awakeWindow`.

**Assumptions & Risks:**
- Assumed every action takes 5 minutes (correct for eye drops, incorrect for others).
- **Risk:** would block high-frequency pill schedules (taking seconds) or allow impossible physio schedules (taking 20+ mins).

#### 3. Export Coupling
- PDF exports had hardcoded column headers saying "Drops".
- ICS calendar files had hardcoded "Drop Reminder" descriptions.
- Dangerous for other domains (e.g., a dentist handing a patient a "Drops" schedule).

---

## Part 2: The Solution (Refactor Implementation)

Following the audit, the engine was refactored to separate the **Generic Scheduling Engine** from the **Clinic Configuration**.

### 1. Renaming & Abstraction
Core symbols were renamed to be generic, with aliases kept for backward compatibility where necessary.

| Old Name (Laser) | New Generic Name | Purpose |
| :--- | :--- | :--- |
| `LaserPrescriptionInput` | `ProtocolScheduleInput` | Input is no longer specific to laser surgery. |
| `buildLaserSchedule` | `buildProtocolSchedule` | Function builds schedules for *any* protocol. |
| `resolveMedicationCollisions` | `resolveActionCollisions` | Handles collisions for any action (exercise, pill). |
| `SurgeryType` | `ProcedureType` | Generic term for medical procedures. |

### 2. Configurable Duration Logic
The hardcoded "5-minute rule" was removed.
- **New Field:** `Medication.minDurationMinutes` (default: 5).
- **Behavior:** The engine now calculates feasibility and collision spacing based on this configuration value, allowing:
    - 0-minute actions (Pills)
    - 20-minute actions (Physio/Rehab)
    - 5-minute actions (Eye Drops)

### 3. Dynamic Exports
- Removed hardcoded strings ("Drops", "Drop Reminder").
- Introduced `actionLabel` in `ClinicConfig`.
- PDF and ICS generators now use the configured label (e.g., "Drops", "Tablets", "Exercises") dynamically.

---

## Part 3: Verification & Backward Compatibility

The refactor ensured that:
1.  **Existing Laser Clinics** (e.g., Ein Tal) continue to work exactly as before, with "Drops" headers and 5-minute safety rules preserved via default configuration.
2.  **New Verticals** can be added purely by creating a new `ClinicConfig` and `Protocol` definition, without modifying the engine code.
