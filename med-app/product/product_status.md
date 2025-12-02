# Product Status & Roadmap: Shaat Hatipa (Med App)

## 1. Product Overview
**Shaat Hatipa** is a web application designed to generate personalized medication schedules for patients recovering from laser eye surgery (Interlasik, PRK). It simplifies the complex post-op drop regimen into an easy-to-follow timeline.

## 2. Current Features
*   **Prescription Wizard**:
    *   **Step 1**: Surgery Details (Type, Date, Wake/Sleep Times).
    *   **Step 2**: Protocol Review (Visual confirmation of medications).
    *   **Step 3**: Schedule Generation (Timeline view).
*   **Scheduling Logic**:
    *   Handles wake/sleep windows.
    *   Resolves collisions (no two drops at exact same time).
    *   Rounds to 30-minute intervals (mostly).
*   **Output**:
    *   Interactive Timeline (Today / 7 Days / All Month).
    *   **Export**: ICS (Calendar) and PDF support.
*   **Validation**:
    *   Zod schema validation for API inputs.
    *   Basic client-side checks (Wake time < Sleep time).

## 3. Identified Gaps & Risks
### User Experience (UX)
*   **Persistence**: The application state is ephemeral. Reloading the page wipes the schedule. This is a critical friction point if a user wants to check their schedule later without re-entering data.
*   **Mobile Experience**: While responsive, the "WorkArea" is quite dense. Need to verify touch targets and scrolling on small screens.
*   **Accessibility**: Color contrast for medication tags needs to be verified against WCAG standards.

### Technical / Business Logic
*   **Rate Limiting**: The API `generate-schedule` has a TODO for rate limiting. Currently vulnerable to abuse.
*   **Protocol Flexibility**: Protocols are hardcoded in constants. If doctors want custom protocols, this needs refactoring.

## 4. Proposed Roadmap (Prioritized)

### Phase 1: Stability & Retention (Immediate)
*   **[P0] Rate Limiting**: Implement Upstash/Redis rate limiting to protect the API.
*   **[P1] Local Persistence**: Save the generated schedule/prescription to `localStorage` so it survives page reloads.

### Phase 2: Enhanced UX
*   **[P2] PWA Support**: Make the app installable so users can access it from their home screen.
*   **[P2] Notifications**: (Requires PWA/Push) Remind users when to take drops.

### Phase 3: Scalability
*   **[P3] User Accounts**: Allow saving multiple schedules or syncing across devices.
*   **[P3] Doctor Portal**: Allow doctors to define custom protocols.

## 5. Next Steps
Awaiting stakeholder (User) decision on which priority to tackle first.
Recommended: **Phase 1 (Rate Limiting & Persistence)**.
