/* ─── Single API client — replaces 4 duplicate apiFetch functions ─── */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Generic JSON fetcher.
 * - Prepends BASE_URL
 * - Sets Content-Type: application/json
 * - Throws on non-2xx with server message
 */
export async function apiFetch<T>(
    path: string,
    init?: RequestInit,
): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> ?? {}),
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${res.statusText} – ${text}`);
    }

    return (await res.json()) as T;
}
