'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
    StopCircleIcon,
    ExclamationTriangleIcon,
    ChartBarIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';

const navItems = [
    { name: 'Arrêts & Analytique', href: '/stops', icon: StopCircleIcon },
    { name: "Causes d'Arrêt", href: '/causes', icon: ExclamationTriangleIcon },
    { name: 'Métrage', href: '/metrage', icon: ChartBarIcon },
    { name: 'Vitesse', href: '/vitesse', icon: BoltIcon },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={clsx(
                    'fixed top-0 left-0 z-50 flex h-screen w-[260px] flex-col',
                    'glass border-r border-white/[0.08]',
                    'transition-transform duration-300 ease-out',
                    'lg:translate-x-0 lg:static lg:z-auto',
                    open ? 'translate-x-0' : '-translate-x-full',
                )}
            >

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (pathname === '/' && item.href === '/stops');
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={clsx(
                                    'group flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium',
                                    'transition-all duration-200 ease-out',
                                    isActive
                                        ? 'gradient-pill text-white'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]',
                                )}
                            >
                                <Icon
                                    className={clsx(
                                        'h-5 w-5 flex-shrink-0 transition-colors',
                                        isActive
                                            ? 'text-white'
                                            : 'text-slate-500 group-hover:text-slate-300',
                                    )}
                                />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/[0.06]">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                        v1.0 — Production
                    </p>
                </div>
            </aside>
        </>
    );
}
