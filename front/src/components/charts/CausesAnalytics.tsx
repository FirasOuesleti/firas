'use client';

import { useCallback, useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { apiFetch } from '@/lib/api';
import { colorForCauseName } from '@/lib/colorHash';
import TooltipGlass from '@/components/charts/TooltipGlass';

/* ── duration formatter ────────────────────────────────── */
function fmtDuration(sec: number): string {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ── types ─────────────────────────────────────────────── */
interface CauseStatRow {
    id: number;
    name: string;
    affectTrs: boolean;
    totalDurationSeconds: number;
    stopCount: number;
}

interface CausesAnalyticsProps {
    from?: string;
    to?: string;
    equipe?: string;
}

export default function CausesAnalytics({ from, to, equipe }: CausesAnalyticsProps) {
    const [data, setData] = useState<CauseStatRow[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            if (equipe) params.set('equipe', equipe);
            const qs = params.toString();
            const url = `/api/causes/stats${qs ? `?${qs}` : ''}`;
            const rows = await apiFetch<CauseStatRow[]>(url);
            setData(rows);
        } catch {
            /* swallow — the list below will show errors */
        } finally {
            setLoading(false);
        }
    }, [from, to, equipe]);

    useEffect(() => { load(); }, [load]);

    /* ── subtitle adapts to filters ── */
    const subtitle = equipe
        ? `Durée totale d\u2019arrêt par cause — ${equipe}`
        : 'Durée totale d\u2019arrêt par cause (toutes équipes confondues)';

    if (loading) {
        return (
            <div className="glass rounded-2xl p-6 mb-6 flex items-center justify-center h-64">
                <span className="text-slate-500 text-sm italic animate-pulse">Chargement des statistiques…</span>
            </div>
        );
    }

    if (data.length === 0) return null;

    return (
        <div className="glass rounded-2xl overflow-hidden shadow-2xl mb-6 p-6">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-white">Analytique globale des causes</h2>
                <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
            </div>

            <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 8, right: 12, left: 0, bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                            dataKey="name"
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            angle={-35}
                            textAnchor="end"
                            interval={0}
                        />
                        <YAxis
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(v: number) => fmtDuration(v)}
                            width={70}
                        />
                        <Tooltip
                            content={
                                <TooltipGlass
                                    valueFormatter={(val) => {
                                        const duration = Number(val);
                                        const count = data.find(d => d.totalDurationSeconds === duration)?.stopCount ?? 0;
                                        return [`${fmtDuration(duration)} (${count} arrêts)`, 'Durée totale'];
                                    }}
                                    labelFormatter={(name) => {
                                        const row = data.find(d => d.name === name);
                                        return row ? row.name : String(name);
                                    }}
                                />
                            }
                            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        />
                        <Bar
                            dataKey="totalDurationSeconds"
                            name="Durée totale"
                            radius={[6, 6, 0, 0]}
                            animationDuration={700}
                            animationEasing="ease-out"
                        >
                            {data.map((entry) => (
                                <Cell key={entry.id} fill={colorForCauseName(entry.name)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
