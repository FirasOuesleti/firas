import { clsx } from 'clsx';

const variants = {
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
    neutral: 'bg-white/[0.04] text-slate-400 border-white/[0.06]',
} as const;

export type BadgeVariant = keyof typeof variants;

export interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    dot?: boolean;
    glow?: boolean;
    className?: string;
}

export default function Badge({
    children,
    variant = 'neutral',
    dot = false,
    glow = false,
    className,
}: BadgeProps) {
    const v = variants[variant];

    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
                'text-[10px] font-semibold uppercase tracking-wider border',
                'transition-all duration-200',
                v,
                glow && variant === 'cyan' && 'shadow-[0_0_12px_rgba(6,182,212,0.2)]',
                glow && variant === 'emerald' && 'shadow-[0_0_12px_rgba(16,185,129,0.2)]',
                glow && variant === 'amber' && 'shadow-[0_0_12px_rgba(245,158,11,0.2)]',
                className,
            )}
        >
            {dot && (
                <span
                    className={clsx(
                        'h-1.5 w-1.5 rounded-full',
                        variant === 'emerald' && 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]',
                        variant === 'red' && 'bg-red-400',
                        variant === 'amber' && 'bg-amber-400',
                        variant === 'neutral' && 'bg-slate-500',
                        variant === 'cyan' && 'bg-cyan-400',
                        variant === 'violet' && 'bg-violet-400',
                    )}
                    aria-hidden="true"
                />
            )}
            {children}
        </span>
    );
}
