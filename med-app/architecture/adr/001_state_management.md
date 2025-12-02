# ADR 001: State Management Strategy

## Status
Accepted

## Context
The application requires managing complex state for the prescription wizard (multi-step form) and the generated schedule. We need to decide how to persist this state and share it between components.

## Decision
We will use a hybrid approach:
1. **URL Search Params**: For the generated schedule state. This allows schedules to be shareable via link and stateless on the server.
2. **React State (useState/useReducer)**: For the ephemeral state within the Wizard steps before generation.
3. **LocalStorage**: For persisting the user's preferences (e.g., last used protocols) and draft wizard state to prevent data loss on refresh.

## Consequences
- **Pros**: 
  - Shareable links (critical for "sending" schedules).
  - No heavy state management library (Redux/Zustand) needed, keeping bundle small.
  - Simple data flow.
- **Cons**:
  - URL length limits (though unlikely to be hit with typical prescription data).
  - Need to handle URL parsing/validation carefully.
