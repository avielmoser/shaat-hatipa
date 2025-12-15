# ICS Timezone Decision: Floating Time

## Overview
We have updated the ICS generation logic to use **Floating Time** for all events. This means `DTSTART` and `DTEND` do not include a "Z" suffix (UTC) and do not include a `TZID` parameter.

## Rationale
Our goal is to ensure that if a user schedules an event for "08:00", it appears as "08:00" on their calendar app, regardless of their current location or timezone settings.

By using Floating Time, the calendar client interprets the event time relative to the user's *current* timezone.

## Changes

### Before (UTC Conversion)
Previously, we converted the local input time to UTC. This caused issues if the user was in a different timezone than the one assumed during conversion (or if they traveled).

Example output (User inputs 08:00 in UTC+2):
```
DTSTART:20240101T060000Z
```
*Issue*: If the user travels to a UTC+1 zone, this event would display as 07:00.

### After (Floating Time)
We now output the exact date and time the user entered, without any timezone information.

Example output (User inputs 08:00):
```
DTSTART:20240101T080000
```
*Result*: This event will always display as 08:00 on the user's device, regardless of where they are in the world.

## Tradeoffs
| Feature | Behavior with Floating Time |
| :--- | :--- |
| **Local Consistency** | **Pro**: Event always stays at 08:00. "Take drops at 8am" means 8am local time. |
| **Travel** | **Pro**: If you fly from Tel Aviv to New York, the reminder moves with you (e.g., from 8am TLV to 8am EST). You don't want to wake up at 2am to take drops. |
| **Coordination** | **Con**: Not suitable for international meetings (e.g., a call at 8am London time). But this is a medical schedule app for the *user*, so this is irrelevant. |

## Implementation
The function `toICalDateTime` in `lib/utils/ics.ts` simply formats the input strings directly:

```typescript
// Input: date="2025-01-01", time="08:00"
// Output: "20250101T080000"
```
