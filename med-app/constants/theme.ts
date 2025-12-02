export const MED_COLORS = [
    "#0ea5e9", // sky-500
    "#a855f7", // purple-500
    "#22c55e", // green-500
    "#f97316", // orange-500
    "#ec4899", // pink-500
    "#eab308", // yellow-500
];

export function getMedicationColor(medIndex: number): string {
    return MED_COLORS[medIndex % MED_COLORS.length];
}
