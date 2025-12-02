# UI/UX Design Plan: Shaat Hatipa

## 1. Visual Identity & Design System
**Goal**: Clean, medical but friendly, high legibility, modern.

### Color Palette (Tailwind v4 / OKLCH)
Based on existing `globals.css` but refined for better contrast and hierarchy.
*   **Primary**: `oklch(0.205 0 0)` (Deep Black/Grey) - Main actions, strong text.
*   **Secondary**: `oklch(0.97 0 0)` (Light Grey) - Backgrounds, secondary actions.
*   **Accent**: Blue/Teal tone for medical feel (currently missing, will propose).
    *   *Proposal*: `oklch(0.6 0.15 240)` (Calm Blue) for active states/highlights.
*   **Background**: `oklch(1 0 0)` (White) - Clean canvas.
*   **Status**:
    *   Success: Green (for completed drops).
    *   Warning: Yellow/Orange (for upcoming collisions).
    *   Error: Red (for validation).

### Typography
*   **Font**: `Geist Sans` (Modern, clean, highly legible).
*   **Scale**:
    *   H1: `text-3xl font-bold tracking-tight` (Page Titles)
    *   H2: `text-xl font-semibold` (Section Headers)
    *   Body: `text-base` (Default text)
    *   Small: `text-sm text-muted-foreground` (Hints, secondary info)

### Spacing & Layout
*   **Container**: Centered, max-width `md` or `lg` for focus.
*   **Padding**: Generous whitespace (`p-6`, `gap-4`) to reduce cognitive load.
*   **Radius**: `rounded-xl` (Soft, friendly corners).

## 2. Component Library (Atomic)
*   **Button**:
    *   `default`: Primary color, rounded-full or lg.
    *   `outline`: Bordered, for secondary actions.
    *   `ghost`: Text only, for back buttons.
*   **Card**:
    *   White bg, subtle shadow (`shadow-sm`), border (`border-border`).
*   **Input**:
    *   Clean border, distinct focus ring (`ring-2 ring-primary/20`).
*   **Stepper**:
    *   Visual progress indicator (1 -> 2 -> 3).
    *   Active step highlighted, completed steps checked.
*   **MedicationTag**:
    *   Pill shape, distinct color per medication type (Antibiotic vs Steroid vs Tears).

## 3. Wireframes & Flows

### Step 1: Surgery Details
**Goal**: Quick data entry, minimize friction.
*   **Layout**: Single column card.
*   **Fields**:
    *   **Surgery Type**: Segmented Control (Interlasik | PRK). *Better than dropdown for 2 options.*
    *   **Date**: Date Picker (Native or Custom). Default to Today.
    *   **Wake/Sleep Time**: Time Inputs.
        *   *UX Improvement*: Visual slider or simple 2-input row.
*   **Action**: "Next: Review Protocol" (Primary Button).

### Step 2: Protocol Review
**Goal**: Confidence building. "Is this what I was prescribed?"
*   **Layout**: List of medications.
*   **Item**:
    *   Icon/Color Code.
    *   Name (e.g., "Moxypin").
    *   Frequency (e.g., "4 times a day").
    *   Duration (e.g., "1 week").
*   **Action**: "Generate Schedule" (Primary Button).
*   **Secondary**: "Back" (Ghost Button).

### Step 3: The Schedule (Timeline)
**Goal**: Clarity. "What do I do NOW?"
*   **Header**: Current Date + Navigation (< Today >).
*   **View Modes**: List View (Mobile default) vs Timeline (Desktop).
*   **Timeline Item**:
    *   Time (e.g., "08:00").
    *   Medication Badge.
    *   Checkbox (for tracking - *Future feature, but design for it*).
*   **Empty States**: "All done for today!" with a celebration icon.
*   **Export Actions**: Floating Action Button (FAB) or sticky bottom bar on mobile.

## 4. UX Improvements (Immediate)
*   **Persistence**: Add a "Saved" indicator in the corner (auto-save to localStorage).
*   **Mobile Optimization**:
    *   Ensure inputs are 16px+ to prevent zoom.
    *   Make buttons full width on mobile.
    *   Increase touch targets for timeline items.

## 5. Accessibility Checklist
*   [ ] Contrast ratio > 4.5:1 for text.
*   [ ] Focus states visible for keyboard nav.
*   [ ] Aria labels on inputs and buttons.

## 6. Component Structure Refactor
**Goal**: Break down the monolithic `WorkArea.tsx` into manageable, testable components.

### Proposed Directory Structure
```
components/
├── wizard/
│   ├── Step1SurgeryDetails.tsx
│   ├── Step2ProtocolReview.tsx
│   ├── Step3Schedule.tsx
│   └── WizardStepper.tsx
├── timeline/
│   ├── TimelineView.tsx
│   ├── TimelineItem.tsx
│   └── TimelineHeader.tsx
└── ui/
    ├── ... (Base components)
```

### State Management
*   Move state from `WorkArea` to a context or keep lifted in a `WizardContainer` component.
*   `usePrescriptionStore` (Zustand or Context) to handle the data across steps.

