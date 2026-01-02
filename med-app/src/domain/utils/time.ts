/**
 * Convert a time string in HH:mm format into the number of minutes
 * since midnight. This helper will throw if the input is malformed.
 */
export function parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(":").map((v) => parseInt(v, 10));
    if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
        throw new Error(`Invalid time string: ${time}`);
    }
    return h * 60 + m;
}

/**
 * Round a number of minutes to the nearest 30-minute increment. This helper
 * takes an absolute number of minutes from 00:00 and returns the closest
 * multiple of 30.
 */
export function roundToHalfHour(minutes: number): number {
    return Math.round(minutes / 30) * 30;
}

/**
 * Convert a number of minutes since midnight into an "HH:mm" string.
 * Values greater than or equal to 24 hours are normalised back into
 * the 0–23 hour range.
 */
export function minutesToTimeStr(totalMinutes: number): string {
    const minutesInDay = 24 * 60;
    const normalised = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
    const h = Math.floor(normalised / 60);
    const m = normalised % 60;
    const hh = h.toString().padStart(2, "0");
    const mm = m.toString().padStart(2, "0");
    return `${hh}:${mm}`;
}

/**
 * Add a number of days to an ISO date string (yyyy-mm-dd). Returns a
 * new ISO date string. This helper does not mutate the original date.
 */
export function addDays(dateStr: string, daysToAdd: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + daysToAdd);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
}
