import { getSlotInstructions, buildInstructionIndex, toSuperscript } from "@/lib/utils/instructions";
import { ActionInstruction, DoseSlot } from "@/types/prescription";

const mockSlot: DoseSlot = {
    id: "slot-1",
    date: "2024-01-01",
    time: "08:00",
    dayIndex: 0,
    medicationId: "med-1",
    medicationName: "Med 1",
    medicationColor: "#000",
    actions: [] // Start with empty actions to allow fallback testing or explicit overrides
};

describe("getSlotInstructions", () => {
    it("should render wait_between_actions from policy for 2+ matching actions", () => {
        const policy = { spacing: { minutes: 5, routes: ["eye_drop" as const] } };
        const slot = {
            ...mockSlot,
            actions: [
                { id: "drop-1", name: "Drop 1", phases: [], route: "eye_drop" as const },
                { id: "drop-2", name: "Drop 2", phases: [], route: "eye_drop" as const }
            ]
        };

        const result = getSlotInstructions([slot], [], policy);
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe("wait_between_actions");
    });

    it("should assign stable sequential numbers starting from 1", () => {
        const inst1: ActionInstruction = { type: "avoid_food" };
        const inst2: ActionInstruction = { type: "note", messageKey: "custom" };

        const result = getSlotInstructions([mockSlot], [inst1, inst2]);

        expect(result[0].number).toBe(1);
        expect(result[1].number).toBe(2);
    });

    it("should pick THE ONLY wait_between_actions from policy even if legacy exist", () => {
        const policy = { spacing: { minutes: 10, routes: ["eye_drop" as const] } };
        const legacyInst: ActionInstruction = { type: "wait_between_actions", minutes: 5 };
        const otherInst: ActionInstruction = { type: "avoid_food" };
        const slot = {
            ...mockSlot,
            actions: [
                { id: "drop-1", name: "Drop 1", phases: [], route: "eye_drop" as const },
                { id: "drop-2", name: "Drop 2", phases: [], route: "eye_drop" as const }
            ]
        };

        const result = getSlotInstructions([slot], [legacyInst, otherInst], policy);

        const waitInsts = result.filter(r => r.type === "wait_between_actions");
        expect(waitInsts).toHaveLength(1); // legacyInst (minutes 5) filtered out because no target
        expect(waitInsts[0]?.minutes).toBe(10);
        expect(waitInsts[0]?.number).toBe(1);
        expect(result[1].number).toBe(2);
    });

    it("should merge clinic defaults and action instructions (filtering non-compliant legacy)", () => {
        const defaultInst: ActionInstruction = { type: "avoid_food" };
        const legacyInst: ActionInstruction = { type: "separate_medications" }; // Should be filtered

        const result = getSlotInstructions(
            [{ ...mockSlot, instructions: [legacyInst] }],
            [defaultInst]
        );

        expect(result).toContainEqual(expect.objectContaining(defaultInst));
        expect(result.find(r => r.type === "separate_medications")).toBeUndefined();
    });

    it("should collect instructions from the actions array in DoseSlot", () => {
        const actionInst: ActionInstruction = { type: "avoid_food" };
        const slot = {
            ...mockSlot,
            actions: [
                { id: "med-1", name: "Med 1", phases: [], instructions: [actionInst] }
            ],
            instructions: [] // Should be ignored because actions is present
        };

        const result = getSlotInstructions([slot]);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject(actionInst);
    });
});

describe("buildInstructionIndex", () => {
    it("should map medication IDs to correct instruction numbers", () => {
        const slot1 = { ...mockSlot, medicationId: "med-1", actions: [{ id: "med-1", name: "Med 1", phases: [] }] };
        const slot2 = { ...mockSlot, id: "slot-2", medicationId: "med-2", actions: [{ id: "med-2", name: "Med 2", phases: [] }] };
        const inst1: ActionInstruction = { type: "avoid_food", appliesToActionIds: ["med-1"] };
        const inst2: ActionInstruction = { type: "note", messageKey: "global" };
        const inst3: ActionInstruction = { type: "note", messageKey: "targeted", appliesToActionIds: ["med-2"] };

        const { numbersByActionId, numberedInstructions } = buildInstructionIndex([slot1, slot2], [inst1, inst2, inst3]);

        expect(numbersByActionId["med-1"]).toContain(1); // avoid_food
        expect(numbersByActionId["med-1"]).toContain(2); // global note
        expect(numbersByActionId["med-2"]).toContain(2); // global note
        expect(numbersByActionId["med-2"]).toContain(3); // targeted note

        expect(numberedInstructions).toHaveLength(3);
    });

    it("should apply instruction to all if appliesToActionIds is an empty array", () => {
        const slot1 = { ...mockSlot, medicationId: "med-1" };
        const slot2 = { ...mockSlot, id: "slot-2", medicationId: "med-2" };
        const inst: ActionInstruction = { type: "avoid_food", appliesToActionIds: [] };

        const { numbersByActionId } = buildInstructionIndex([slot1, slot2], [inst]);

        expect(numbersByActionId["med-1"]).toContain(1);
        expect(numbersByActionId["med-2"]).toContain(1);
    });
});

describe("toSuperscript", () => {
    it("should convert numbers to superscripts", () => {
        expect(toSuperscript(1)).toBe("¹");
        expect(toSuperscript(12)).toBe("¹²");
        expect(toSuperscript(0)).toBe("⁰");
    });
});

describe("instruction requirements", () => {
    it("Case A: instruction without appliesToActionIds applies to all", () => {
        const slot1 = { ...mockSlot, medicationId: "med-1" };
        const slot2 = { ...mockSlot, id: "slot-2", medicationId: "med-2" };
        const inst: ActionInstruction = { type: "avoid_food" };
        const { numbersByActionId } = buildInstructionIndex([slot1, slot2], [inst]);
        expect(numbersByActionId["med-1"]).toContain(1);
        expect(numbersByActionId["med-2"]).toContain(1);
    });

    it("Case B: instruction with appliesToActionIds applies only to matching action", () => {
        const slot1 = { ...mockSlot, medicationId: "med-1" };
        const slot2 = { ...mockSlot, id: "slot-2", medicationId: "med-2" };
        const inst: ActionInstruction = { type: "avoid_food", appliesToActionIds: ["med-1"] };
        const { numbersByActionId } = buildInstructionIndex([slot1, slot2], [inst]);
        expect(numbersByActionId["med-1"]).toContain(1);
        expect(numbersByActionId["med-2"]).toBeUndefined();
    });

    it("Case C: appliesToActionIds empty array behaves like undefined", () => {
        const slot1 = { ...mockSlot, medicationId: "med-1" };
        const inst: ActionInstruction = { type: "avoid_food", appliesToActionIds: [] };
        const { numbersByActionId } = buildInstructionIndex([slot1], [inst]);
        expect(numbersByActionId["med-1"]).toContain(1);
    });

    it("Case D: wait_between_actions minutes=0 never renders", () => {
        const inst: ActionInstruction = { type: "wait_between_actions", minutes: 0 };
        const result = getSlotInstructions([mockSlot, { ...mockSlot, id: "slot-2" }], [inst]);
        expect(result).toHaveLength(0);
    });

    it("Case E: slot has 1 action => wait_between_actions never renders", () => {
        const inst: ActionInstruction = { type: "wait_between_actions", minutes: 5 };
        const result = getSlotInstructions([mockSlot], [inst]);
        expect(result).toHaveLength(0);
    });
});

describe("selective spacing policy", () => {
    const policy = {
        spacing: {
            minutes: 5,
            routes: ["eye_drop" as const]
        }
    };

    it("should show wait instruction for 2 eye drops", () => {
        const slot = {
            ...mockSlot,
            actions: [
                { id: "drop-1", name: "Drop 1", phases: [], route: "eye_drop" as const },
                { id: "drop-2", name: "Drop 2", phases: [], route: "eye_drop" as const }
            ]
        };
        const result = getSlotInstructions([slot], [], policy);
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe("wait_between_actions");
        expect((result[0] as any).messageKey).toBe("slotNote_waitBetweenEyeDrops");
        expect(result[0].appliesToActionIds).toContain("drop-1");
        expect(result[0].appliesToActionIds).toContain("drop-2");
    });

    it("should NOT show wait instruction for 2 oral meds", () => {
        const slot = {
            ...mockSlot,
            actions: [
                { id: "pill-1", name: "Pill 1", phases: [], route: "oral" as const },
                { id: "pill-2", name: "Pill 2", phases: [], route: "oral" as const }
            ]
        };
        const result = getSlotInstructions([slot], [], policy);
        expect(result).toHaveLength(0);
    });

    it("should NOT show wait instruction for 1 eye drop and 1 oral med", () => {
        const slot = {
            ...mockSlot,
            actions: [
                { id: "drop-1", name: "Drop 1", phases: [], route: "eye_drop" as const },
                { id: "pill-1", name: "Pill 1", phases: [], route: "oral" as const }
            ]
        };
        const result = getSlotInstructions([slot], [], policy);
        expect(result).toHaveLength(0);
    });

    it("should treat missing route as 'other' and NOT show wait", () => {
        const slot = {
            ...mockSlot,
            actions: [
                { id: "drop-1", name: "Drop 1", phases: [], route: "eye_drop" as const },
                { id: "misc-1", name: "Misc 1", phases: [] } // route missing
            ]
        };
        const result = getSlotInstructions([slot], [], policy);
        expect(result).toHaveLength(0);
    });

    it("should filter out legacy separate_medications without targets", () => {
        const legacyInst: ActionInstruction = { type: "separate_medications" };
        const result = getSlotInstructions([mockSlot], [legacyInst], policy);
        expect(result).toHaveLength(0);
    });

    it("should filter out legacy wait_between_actions from defaultInstructions", () => {
        const legacyInst: ActionInstruction = { type: "wait_between_actions", minutes: 5 };
        const result = getSlotInstructions([mockSlot, { ...mockSlot, id: "slot-2" }], [legacyInst], policy);
        // Should be empty because legacyInst has no targets and policy is the authority
        expect(result).toHaveLength(0);
    });

    it("should allow separate_medications if it has valid targets and matches policy", () => {
        const targetedInst: ActionInstruction = {
            type: "separate_medications",
            appliesToActionIds: ["drop-1", "drop-2"]
        };
        const slot = {
            ...mockSlot,
            actions: [
                { id: "drop-1", name: "Drop 1", phases: [], route: "eye_drop" as const },
                { id: "drop-2", name: "Drop 2", phases: [], route: "eye_drop" as const }
            ]
        };
        const result = getSlotInstructions([slot], [targetedInst], policy);
        // Should have 2: 1 from policy (wait), 1 from purposeful manual instruction (separate)
        expect(result.some(r => r.type === "separate_medications")).toBe(true);
    });

    it("should NOT allow separate_medications for oral even if targeted", () => {
        const targetedInst: ActionInstruction = {
            type: "separate_medications",
            appliesToActionIds: ["pill-1", "pill-2"]
        };
        const slot = {
            ...mockSlot,
            actions: [
                { id: "pill-1", name: "Pill 1", phases: [], route: "oral" as const },
                { id: "pill-2", name: "Pill 2", phases: [], route: "oral" as const }
            ]
        };
        const result = getSlotInstructions([slot], [targetedInst], policy);
        expect(result).toHaveLength(0);
    });
});
