'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import ExcelExportButton from '../components/ExcelExportButton';
import TooltipGlass from '@/components/charts/TooltipGlass';
import { apiFetch } from '@/lib/api';
import { formatLocalYYYYMMDD, formatDayFR } from '@/lib/dates';
import type { MetrageDailyPoint, MetrageTotalResponse } from '@/types/api';
import KpiCard from '@/components/ui/KpiCard';

export default function MetrageClient() {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

    // Default: last 7 days
    const [from, setFrom] = useState<string>(formatLocalYYYYMMDD(sevenDaysAgo));
    const [to, setTo] = useState<string>(formatLocalYYYYMMDD(today));

    // manual insert
    const [recordedAt, setRecordedAt] = useState<string>(''); // datetime-local
    const [meters, setMeters] = useState<string>('0');
    const [note, setNote] = useState<string>('');

    const [daily, setDaily] = useState<MetrageDailyPoint[]>([]);
    const [total, setTotal] = useState<MetrageTotalResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        return params.toString();
    }, [from, to]);

    const load = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const [dailyRes, totalRes] = await Promise.all([
                apiFetch<MetrageDailyPoint[]>(`/api/metrage/daily?${queryString}`),
                apiFetch<MetrageTotalResponse>(`/api/metrage/total?${queryString}`),
            ]);
            setDaily(dailyRes);
            setTotal(totalRes);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Erreur lors du chargement du métrage';
            setErr(msg);
        } finally {
            setLoading(false);
        }
    }, [queryString]);

    useEffect(() => {
        load();
    }, [load]);

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        const metersNum = Number(meters);
        if (Number.isNaN(metersNum) || metersNum < 0) {
            setErr('Meters doit être un nombre >= 0');
            return;
        }

        try {
            await apiFetch('/api/metrage', {
                method: 'POST',
                body: JSON.stringify({
                    recordedAt: recordedAt || undefined,
                    meters: metersNum,
                    note: note || undefined,
                }),
            });

            setRecordedAt('');
            setMeters('0');
            setNote('');
            await load();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'La création a échoué';
            setErr(msg);
        }
    }

    return (
        <div className="text-sm">
            {err && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-4 text-red-400 rounded-r-lg">
                    <strong>Erreur:</strong> {err}
                </div>
            )}

            {/* Chart card */}
            <div className="glass rounded-2xl overflow-hidden mb-8 p-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-white">Métrage produit par jour</h2>
                        <p className="text-xs text-slate-400 mt-1">Courbe journalière sur la période sélectionnée</p>
                    </div>

                    <div className="flex gap-3 items-end flex-wrap">
                        <label className="text-slate-400 text-[11px] uppercase tracking-wide font-semibold">
                            Début
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="mt-1 w-full bg-white/[0.04] border border-white/[0.08] text-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all dark:[color-scheme:dark]"
                            />
                        </label>

                        <label className="text-slate-400 text-[11px] uppercase tracking-wide font-semibold">
                            Fin
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="mt-1 w-full bg-white/[0.04] border border-white/[0.08] text-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all dark:[color-scheme:dark]"
                            />
                        </label>

                        <button
                            onClick={load}
                            disabled={loading}
                            className="px-4 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 rounded-lg border border-white/[0.08] transition-all uppercase text-xs font-medium tracking-wide h-[34px]"
                        >
                            Actualiser
                        </button>

                        <ExcelExportButton
                            data={daily}
                            fileName="metrage_journalier_export"
                            sheetName="Métrage"
                            label="Exporter excel"
                        />


                        <KpiCard
                            label="Total Période"
                            value={total ? `${total.totalMeters.toFixed(3)} m` : '—'}
                            tone="cyan"
                            className="min-w-[120px]"
                            compact
                        />
                    </div>
                </div>

                <div className="h-[320px] w-full">
                    {daily.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={daily} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="gradMetrage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    stroke="#64748b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => formatDayFR(v)}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val}m`}
                                />
                                <Tooltip
                                    content={
                                        <TooltipGlass
                                            valueFormatter={(value) => [
                                                `${Number(value ?? 0).toFixed(3)} m`,
                                                'Métrage',
                                            ]}
                                        />
                                    }
                                    cursor={{ stroke: 'rgba(6,182,212,0.15)', strokeWidth: 1 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="totalMeters"
                                    stroke="#06b6d4"
                                    strokeWidth={2.5}
                                    fill="url(#gradMetrage)"
                                    dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
                                    activeDot={{ r: 6, fill: '#22d3ee', strokeWidth: 0 }}
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">
                            {loading ? 'Chargement...' : 'Aucune donnée sur la période.'}
                        </div>
                    )}
                </div>
            </div>

            {/* Manual insert */}
            <div className="glass rounded-2xl overflow-hidden p-6">
                <h2 className="text-lg font-bold text-white mb-4">Ajouter une entrée (manuel)</h2>

                <form onSubmit={onCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        Date/Heure (Optionnel)
                        <input
                            type="datetime-local"
                            value={recordedAt}
                            onChange={(e) => setRecordedAt(e.target.value)}
                            className="mt-1.5 w-full bg-white/[0.04] border border-white/[0.08] text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all dark:[color-scheme:dark]"
                        />
                    </label>

                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                        Mètres
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={meters}
                            onChange={(e) => setMeters(e.target.value)}
                            className="mt-1.5 w-full bg-white/[0.04] border border-white/[0.08] text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                        />
                    </label>

                    <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider md:col-span-2">
                        Note (Optionnel)
                        <div className="flex gap-2 mt-1.5">
                            <input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/[0.08] text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-600"
                                placeholder="ex: Essai 1..."
                            />
                            <button
                                type="submit"
                                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 font-bold uppercase tracking-wide text-xs transition-all active:scale-95 whitespace-nowrap"
                            >
                                Ajouter
                            </button>
                        </div>
                    </label>
                </form>
            </div>
        </div>
    );
}
