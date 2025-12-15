import { toICalDateTime, downloadScheduleIcs } from "../lib/utils/ics";

describe("ICS Utils", () => {
    describe("toICalDateTime", () => {
        it("should generate a floating time string (no Z, exact input time)", () => {
            // Input: 08:00
            // Expected: "20251225T080000" (Exact mapping, no timezone shift)

            const date = "2025-12-25";
            const time = "08:00";

            const result = toICalDateTime(date, time);

            expect(result).toBe("20251225T080000");
            expect(result).not.toContain("Z");
        });

        it("should handle single digit hours/months correctly", () => {
            const date = "2025-01-09";
            const time = "09:05";

            const result = toICalDateTime(date, time);

            expect(result).toBe("20250109T090500");
        });
    });

    // Note: We can't easily test downloadScheduleIcs in node environment because it uses Blob and document.
    // But we can verify the toICalDateTime logic which is the core of the fix.
});
