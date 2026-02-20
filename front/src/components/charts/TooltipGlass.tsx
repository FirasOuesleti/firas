import { formatDayFR } from '@/lib/dates';

/* ── types ────────────────────────────────── */
interface PayloadItem {
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string;
}

export interface TooltipGlassProps {
    active?: boolean;
    payload?: PayloadItem[];
    label?: string;
    /** Custom label formatter — defaults to formatDayFR */
    labelFormatter?: (label: string) => string;
    /** Custom value formatter per dataKey.  Return [displayValue, displayName]. */
    valueFormatter?: (value: number | string, dataKey: string) => [string, string];
}

/* ── component ────────────────────────────── */
export default function TooltipGlass({
    active,
    payload,
    label,
    labelFormatter,
    valueFormatter,
}: TooltipGlassProps) {
    if (!active || !payload?.length) return null;

    const fmtLabel = labelFormatter
        ? labelFormatter(String(label ?? ''))
        : formatDayFR(String(label ?? ''));

    return (
        <div className="rounded-xl border border-white/[0.1] bg-slate-900/90 backdrop-blur-xl shadow-2xl px-4 py-3 min-w-[140px]">
            <p className="text-[11px] text-slate-400 font-medium mb-2">{fmtLabel}</p>
            <div className="space-y-1">
                {payload.map((item, i) => {
                    const raw = item.value ?? 0;
                    const key = item.dataKey ?? item.name ?? '';
                    const [val, name] = valueFormatter
                        ? valueFormatter(raw, key)
                        : [String(raw), key];

                    return (
                        <div key={i} className="flex items-center gap-2">
                            <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.color ?? '#94a3b8' }}
                            />
                            <span className="text-xs text-slate-300">{name}</span>
                            <span className="ml-auto text-xs font-semibold text-white tabular-nums">
                                {val}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
