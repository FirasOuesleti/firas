'use client';

import { clsx } from 'clsx';

/* ─── Tone → gradient / glow mapping ───────────────────── */
const toneStyles = {
    cyan: {
        border: 'border-cyan-500/20',
        glow: 'hover:shadow-[0_0_24px_rgba(6,182,212,0.15)]',
        label: 'text-cyan-400',
        accent: 'from-cyan-500/10 to-transparent',
    },
    violet: {
        border: 'border-violet-500/20',
        glow: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.15)]',
        label: 'text-violet-400',
        accent: 'from-violet-500/10 to-transparent',
    },
    emerald: {
        border: 'border-emerald-500/20',
        glow: 'hover:shadow-[0_0_24px_rgba(16,185,129,0.15)]',
        label: 'text-emerald-400',
        accent: 'from-emerald-500/10 to-transparent',
    },
    amber: {
        border: 'border-amber-500/20',
        glow: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.15)]',
        label: 'text-amber-400',
        accent: 'from-amber-500/10 to-transparent',
    },
    neutral: {
        border: 'border-white/[0.08]',
        glow: 'hover:shadow-[0_0_24px_rgba(148,163,184,0.08)]',
        label: 'text-slate-400',
        accent: 'from-slate-500/5 to-transparent',
    },
} as const;

export type KpiTone = keyof typeof toneStyles;

export interface KpiCardProps {
    label: string;
    value: string | number;
    sublabel?: string;
    icon?: React.ReactNode;
    tone?: KpiTone;
    className?: string;
    compact?: boolean;
}

export default function KpiCard({
    label,
    value,
    sublabel,
    icon,
    tone = 'neutral',
    className,
    compact = false,
}: KpiCardProps) {
    const t = toneStyles[tone];

    return (
        <div
            className={clsx(
                'group relative overflow-hidden rounded-2xl',
                compact ? 'px-4 py-2' : 'p-5',
                'glass transition-all duration-300',
                t.border,
                t.glow,
                className,
            )}
        >
            {/* Subtle gradient overlay */}
            <div
                className={clsx(
                    'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60',
                    t.accent,
                )}
            />

            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <p
                        className={clsx(
                            compact ? 'text-[10px] mb-0' : 'text-[11px] mb-1',
                            'font-semibold uppercase tracking-wider',
                            t.label,
                        )}
                    >
                        {label}
                    </p>
                    <p className={clsx(
                        compact ? 'text-xl md:text-2xl' : 'text-3xl',
                        "font-bold tracking-tight text-slate-50 tabular-nums leading-none"
                    )}>
                        {value}
                    </p>
                    {sublabel && (
                        <p className="mt-1.5 text-xs text-slate-500">{sublabel}</p>
                    )}
                </div>

                {icon && !compact && (
                    <div
                        className={clsx(
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                            'bg-white/[0.04] border border-white/[0.06]',
                            'text-slate-500 group-hover:text-slate-300 transition-colors',
                        )}
                        aria-hidden="true"
                    >
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
