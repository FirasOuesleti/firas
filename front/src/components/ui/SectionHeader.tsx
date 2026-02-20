import { clsx } from 'clsx';

export interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    className?: string;
}

export default function SectionHeader({
    title,
    subtitle,
    actions,
    className,
}: SectionHeaderProps) {
    return (
        <div
            className={clsx(
                'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3',
                'p-5 border-b border-white/[0.06]',
                className,
            )}
        >
            <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
    );
}
