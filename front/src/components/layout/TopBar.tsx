'use client';

import { usePathname } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';

const pageTitles: Record<string, string> = {
    '/stops': 'Arrêts & Analytique',
    '/causes': "Causes d'Arrêt",
    '/metrage': 'Métrage',
    '/vitesse': 'Vitesse',
};

interface TopBarProps {
    onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
    const pathname = usePathname();
    const title = pageTitles[pathname] ?? 'Dashboard';

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 px-6 glass border-b border-white/[0.06]">
            {/* Hamburger (mobile) */}
            <button
                onClick={onMenuClick}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-colors lg:hidden"
                aria-label="Toggle sidebar"
            >
                <Bars3Icon className="h-5 w-5" />
            </button>

            {/* Page title */}
            <h2 className="text-lg font-semibold text-slate-100 tracking-tight">
                {title}
            </h2>

        </header>
    );
}
