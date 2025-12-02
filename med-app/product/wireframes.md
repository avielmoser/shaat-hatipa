# Textual Wireframes: Shaat Hatipa

## Screen 1: Surgery Details (The "Input" Phase)

**Header**
- Logo: "Shaat Hatipa" (Left)
- Step Indicator: [ **1. Details** ] - [ 2. Review ] - [ 3. Schedule ]

**Main Card (Centered)**
- **Title**: "Let's set up your recovery schedule"
- **Subtitle**: "Enter your surgery details below."

**Form Fields**
1.  **Surgery Type** (Label: "Surgery Type")
    - [ (Radio/Segment) **Interlasik** ] [ (Radio/Segment) PRK ]
    - *Note: Default to Interlasik.*

2.  **Surgery Date** (Label: "When was your surgery?")
    - [ Date Input: DD/MM/YYYY ] (Icon: Calendar)
    - *Helper Text: "Today is Dec 2nd"*

3.  **Daily Routine** (Label: "When do you wake up and sleep?")
    - Row:
        - [ Time Input: 07:00 ] (Label: Wake Up)
        - [ Time Input: 23:00 ] (Label: Sleep)
    - *Note: This defines the active window for drops.*

**Footer (Sticky on Mobile)**
- [ Button: **Next Step** (Primary, Full Width) ] -> Go to Screen 2

---

## Screen 2: Protocol Review (The "Confirmation" Phase)

**Header**
- Step Indicator: [ 1. Details ] - [ **2. Review** ] - [ 3. Schedule ]

**Main Card**
- **Title**: "Review your Protocol"
- **Subtitle**: "Based on Interlasik surgery."

**Medication List**
- **Group 1: Antibiotics** (Header)
    - [ Icon: Pill/Drop ] **Moxypin**
    - "4 times a day" | "For 1 week"
    - *Visual Tag: Yellow*

- **Group 2: Steroids** (Header)
    - [ Icon: Pill/Drop ] **Sterodex**
    - "4 times a day" | "For 1 week"
    - *Visual Tag: Red*

- **Group 3: Artificial Tears** (Header)
    - [ Icon: Drop ] **Tears**
    - "Every 2 hours" | "As needed"
    - *Visual Tag: Blue*

**Alert/Info Box**
- [ Icon: Info ] "We've calculated the optimal times based on your wake up time (07:00)."

**Footer**
- [ Button: Back (Ghost) ]
- [ Button: **Generate Schedule** (Primary, Full Width) ] -> Go to Screen 3

---

## Screen 3: The Schedule (The "Action" Phase)

**Header**
- **Title**: "Your Schedule"
- **Actions**: [ Button: Export PDF ] [ Button: Add to Calendar ]

**Timeline Controls**
- [ < Prev Day ] **Today, Dec 2nd** [ Next Day > ]
- *Progress Bar: 40% of drops completed*

**Timeline Feed (Vertical)**
- **08:00** (Time Slot)
    - [ Card: **Moxypin** (Yellow Border) ]
        - "1 drop, Right Eye"
        - [ Checkbox: Done ]
    - [ Card: **Sterodex** (Red Border) ]
        - "1 drop, Right Eye"
        - [ Checkbox: Done ]

- **10:00** (Time Slot)
    - [ Card: **Tears** (Blue Border) ]
        - "Both Eyes"

- **12:00** (Time Slot)
    - ...

**Empty State (End of Day)**
- [ Illustration: Sleepy Eye / Moon ]
- "All done for today! See you tomorrow at 07:00."

**Floating Action (Mobile)**
- [ FAB: Calendar Icon ] (Quick export)
