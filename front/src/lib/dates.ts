/* ─── Timezone-safe date utilities ─── */

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

/**
 * Returns YYYY-MM-DD in LOCAL timezone — never uses toISOString().
 */
export function formatLocalYYYYMMDD(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Formats a YYYY-MM-DD string as DD/MM/YYYY for French display.
 */
export function formatDayFR(day: string): string {
    if (!day) return '';
    const datePart = day.split('T')[0]; // safe if ISO or date-only
    const [y, m, d] = datePart.split('-');
    return `${d}/${m}/${y}`;
}

/**
 * Formats an ISO datetime string as a French locale string.
 */
export function formatDateTime(dateStr: string | null): string {
    if (!dateStr) return 'En cours';
    const d = new Date(dateStr);
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Formats total seconds as HH:MM:SS.
 */
export function formatHMS(totalSeconds: number): string {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

/**
 * Formats seconds as a human-friendly short duration (e.g. "2h 15m 30s").
 */
export function formatDuration(seconds: number): string {
    const sec = Math.max(0, Math.floor(seconds));
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m < 60) return `${m}m ${s}s`;
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}h ${remM}m ${s}s`;
}
