/**
 * Deterministic cause-name → color utility.
 *
 * Every cause name always maps to the same color across all charts,
 * pages, sessions, and builds. Designed for dark UI backgrounds.
 *
 * Strategy: hash the lowercased name → index into a hand-picked
 * 20-color palette with high contrast on dark surfaces.
 */

// ── Hand-picked palette (20 colors, dark-UI safe) ──────────────
// Each color has high saturation and ~55-65% lightness for maximum
// contrast against slate-900 / slate-950 backgrounds.
const PALETTE = [
    '#06b6d4', // cyan-500
    '#8b5cf6', // violet-500
    '#f59e0b', // amber-500
    '#10b981', // emerald-500
    '#ef4444', // red-500
    '#ec4899', // pink-500
    '#3b82f6', // blue-500
    '#f97316', // orange-500
    '#14b8a6', // teal-500
    '#a855f7', // purple-500
    '#eab308', // yellow-500
    '#6366f1', // indigo-500
    '#22c55e', // green-500
    '#e11d48', // rose-600
    '#0ea5e9', // sky-500
    '#d946ef', // fuchsia-500
    '#84cc16', // lime-500
    '#f43f5e', // rose-500
    '#2dd4bf', // teal-400
    '#818cf8', // indigo-400
] as const;

// ── Stable 32-bit hash (djb2) ──────────────────────────────────
function djb2(s: string): number {
    let h = 5381;
    for (let i = 0; i < s.length; i++) {
        h = ((h << 5) + h + s.charCodeAt(i)) | 0; // h * 33 + c
    }
    return Math.abs(h);
}

/**
 * Return a deterministic hex color for the given cause name.
 *
 * - Input is trimmed and lowercased before hashing so "Panne Machine"
 *   and "panne machine" always produce the same color.
 * - The same name always returns the same color.
 * - No Math.random().
 */
export function colorForCauseName(name: string): string {
    const normalized = name.trim().toLowerCase();
    return PALETTE[djb2(normalized) % PALETTE.length];
}
