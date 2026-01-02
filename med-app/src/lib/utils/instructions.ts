import { ActionInstruction, DoseSlot } from "../../types/prescription";

export type ProcessedInstruction = ActionInstruction & {
    id: string;
    number?: number;
};

/**
 * Aggregates and de-duplicates instructions for a group of slots.
 * 
 * Rules:
 * - Merge clinic defaults + action instructions.
 * - wait_between_actions: only if slots.length >= 2 AND minutes > 0.
 * - Pick MAX minutes for wait_between_actions.
 * - De-duplicate other instructions based on content.
 * - Assign stable numbers (1, 2, 3...) to instructions.
 */
export function getSlotInstructions(
    slots: DoseSlot[],
    defaultInstructions?: ActionInstruction[],
    slotRules?: { spacing?: { minutes: number; routes: Array<"eye_drop" | "oral" | "other"> } }
): ProcessedInstruction[] {
    const rawInstructions: ActionInstruction[] = [];
    const spacingPolicy = slotRules?.spacing;

    // 1. Generate spacing instructions ONLY from policy
    if (spacingPolicy && spacingPolicy.minutes > 0) {
        const routes = spacingPolicy.routes;
        const allActions = slots.flatMap(s => s.actions || []);
        const spacedActions = allActions.filter(a => routes.includes(a.route ?? "other"));

        if (spacedActions.length >= 2) {
            rawInstructions.push({
                type: "wait_between_actions",
                minutes: spacingPolicy.minutes,
                messageKey: "slotNote_waitBetweenEyeDrops",
                params: { minutes: spacingPolicy.minutes },
                appliesToActionIds: Array.from(new Set(spacedActions.map(a => a.id)))
            });
        }
    }

    // Helper to filter legacy instructions
    const isPolicyCompliant = (inst: ActionInstruction): boolean => {
        if (inst.type !== "wait_between_actions" && inst.type !== "separate_medications") {
            return true;
        }

        // Must have explicit targets
        if (!inst.appliesToActionIds || inst.appliesToActionIds.length === 0) {
            return false;
        }

        // AND those targets must be in the slot and meet route requirements
        const allActions = slots.flatMap(s => s.actions || []);
        const targetedActionsInSlot = allActions.filter(a => inst.appliesToActionIds!.includes(a.id));

        if (targetedActionsInSlot.length < 2) return false;

        // AND all targeted actions must meet route requirements (if policy exists)
        if (spacingPolicy) {
            const routes = spacingPolicy.routes;
            return targetedActionsInSlot.every(a => routes.includes(a.route ?? "other"));
        }

        return true;
    };

    // 2. Add default instructions (filtered)
    if (defaultInstructions) {
        rawInstructions.push(...defaultInstructions.filter(isPolicyCompliant));
    }

    // 3. Add action-level instructions (filtered)
    slots.forEach(slot => {
        if (slot.actions && slot.actions.length > 0) {
            slot.actions.forEach(action => {
                if (action.instructions) {
                    rawInstructions.push(...action.instructions.filter(isPolicyCompliant));
                }
            });
        }
        else if (slot.instructions) {
            rawInstructions.push(...slot.instructions.filter(isPolicyCompliant));
        }
    });

    // Stability: Sort instructions to ensure consistent numbering
    rawInstructions.sort((a, b) => {
        if (a.type !== b.type) {
            // Prioritize wait_between_actions to get number 1
            if (a.type === 'wait_between_actions') return -1;
            if (b.type === 'wait_between_actions') return 1;
            return a.type.localeCompare(b.type);
        }
        if (a.type === 'note' && b.type === 'note') {
            if (a.messageKey !== b.messageKey) return a.messageKey.localeCompare(b.messageKey);
        }
        if (a.type === 'wait_between_actions' && b.type === 'wait_between_actions') {
            if (a.minutes !== b.minutes) return a.minutes - b.minutes;
        }
        const idsA = (a.appliesToActionIds && a.appliesToActionIds.length > 0) ? [...a.appliesToActionIds].sort().join(',') : '';
        const idsB = (b.appliesToActionIds && b.appliesToActionIds.length > 0) ? [...b.appliesToActionIds].sort().join(',') : '';
        return idsA.localeCompare(idsB);
    });

    const uniqueInstructions: ProcessedInstruction[] = [];
    const seenKeys = new Set<string>();
    let currentNumber = 1;

    rawInstructions.forEach((inst, idx) => {
        // Normalize for de-duplication
        const normalized = { ...inst };
        if (normalized.appliesToActionIds && normalized.appliesToActionIds.length === 0) {
            delete normalized.appliesToActionIds;
        }

        const key = JSON.stringify(normalized);
        if (!seenKeys.has(key)) {
            seenKeys.add(key);
            uniqueInstructions.push({
                ...inst,
                id: `inst-${idx}`,
                number: currentNumber++
            });
        }
    });

    return uniqueInstructions;
}

/**
 * Determines if an instruction applies to a specific action.
 * Rule: if appliesToActionIds is missing or empty, it applies to ALL actions.
 */
export function instructionAppliesToAction(instruction: ActionInstruction, actionId: string): boolean {
    if (!instruction.appliesToActionIds || instruction.appliesToActionIds.length === 0) {
        return true;
    }
    return instruction.appliesToActionIds.includes(actionId);
}

/**
 * Builds a mapping of medication IDs to instruction numbers and a list of numbered instructions.
 * Used by UI components to render superscripts and lists.
 */
export function buildInstructionIndex(
    slots: DoseSlot[],
    defaultInstructions?: ActionInstruction[],
    slotRules?: { spacing?: { minutes: number; routes: Array<"eye_drop" | "oral" | "other"> } }
) {
    const processed = getSlotInstructions(slots, defaultInstructions, slotRules);

    const numbersByActionId: Record<string, number[]> = {};

    // Map each action to its applicable instruction numbers
    // Extract all unique action IDs from the actions array within slots
    const allActionIds = Array.from(new Set(slots.flatMap(s => (s.actions || []).map(a => a.id))));

    // Fallback: if actions array is missing, use medicationId
    if (allActionIds.length === 0) {
        slots.forEach(s => allActionIds.push(s.medicationId));
    }

    const uniqueActionIds = Array.from(new Set(allActionIds));

    uniqueActionIds.forEach(id => {
        const applicable = processed
            .filter(inst => instructionAppliesToAction(inst, id))
            .map(inst => inst.number!)
            .sort((a, b) => a - b);

        if (applicable.length > 0) {
            numbersByActionId[id] = Array.from(new Set(applicable)); // De-duplicate numbers
        }
    });

    return {
        numbersByActionId,
        numberedInstructions: processed
    };
}

/**
 * Converts a number to its superscript string representation.
 * Supports multi-digit numbers.
 */
export function toSuperscript(n: number): string {
    const map: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
        '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
    return n.toString().split('').map(d => map[d] || d).join('');
}
