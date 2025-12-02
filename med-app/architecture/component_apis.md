# Component API Specifications

## Feature: Prescription Wizard

### `WizardContainer`
Orchestrates the steps and manages the overall `LaserPrescriptionInput` state.

**Props**: None (Client Component)

**State**:
- `step`: number (0-2)
- `data`: `LaserPrescriptionInput` (Partial)

### `StepSurgeryType`
**Props**:
- `value`: `SurgeryType | null`
- `onChange`: `(type: SurgeryType) => void`
- `onNext`: `() => void`

### `StepTimes`
**Props**:
- `wakeTime`: string (HH:mm)
- `sleepTime`: string (HH:mm)
- `surgeryDate`: Date
- `onChange`: `(field: keyof LaserPrescriptionInput, value: any) => void`
- `onNext`: `() => void`
- `onBack`: `() => void`

### `StepMedications`
**Props**:
- `medications`: `Medication[]`
- `onChange`: `(medications: Medication[]) => void`
- `onGenerate`: `() => void`
- `onBack`: `() => void`

---

## Feature: Schedule Display

### `Timeline`
Displays the list of doses.

**Props**:
- `slots`: `DoseSlot[]`
- `groupBy`: `'day' | 'time'` (optional, default 'day')

### `DayView`
Sub-component of Timeline for a specific day.

**Props**:
- `date`: string (ISO Date)
- `slots`: `DoseSlot[]`

### `DownloadActions`
Buttons to export the schedule.

**Props**:
- `schedule`: `DoseSlot[]`
- `onDownloadICS`: `() => void`
- `onPrint`: `() => void`
