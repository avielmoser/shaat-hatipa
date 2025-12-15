# Test Notes

## Overview
We have introduced Unit Tests using **Jest** to verify the Domain-Agnostic Protocol Engine.

## Running Tests
To run the automated test suite:
```bash
npm test
```

## Test Cases Covered
The tests in `__tests__/schedule-builder.test.ts` cover:

1.  **Pills (0 min duration)**: Verifies that multiple pills can be scheduled.
2.  **Physio (20 min duration)**: Verifies that long-duration actions do not overlap (collision resolution works for ranges).
3.  **Mixed Protocols**: Verifies that pills and physio can coexist.
4.  **Impossible Schedules**: Verifies that the engine rejects schedules that don't fit in the awake window.
5.  **Backward Compatibility**: Verifies that explicitly setting `5 min` duration (Laser default) produces spaced schedules.

## Configuration Updates
- **Clinics**: `config/clinics/default.ts` now includes `defaultActionDuration: 5`.
- **Engine**: The hardcoded 5-minute rule has been removed from `schedule-builder.ts`. It now respects `minDurationMinutes` on the action, or defaults to 0 (Generic).
- **Resolver**: `protocol-resolver.ts` injects the clinic's default duration into actions that don't specify one.

## Manual Verification
- Launch the app: `npm run dev`
- Walk through the Wizard with "Laser" (default) type.
- Verify the generated schedule respects the 5-minute spacing (checking PDF or on-screen schedule).
