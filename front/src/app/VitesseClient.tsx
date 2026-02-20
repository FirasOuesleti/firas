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
import { formatLocalYYYYMMDD, formatDayFR, formatDateTime } from '@/lib/dates';
import type { VitesseDailyPoint, VitesseSummary, VitesseEntry, PagedResponse } from '@/types/api';
import KpiCard from '@/components/ui/KpiCard';

export default function VitesseClient() {
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);

    // Filters (default last 7 days)
    const [from, setFrom] = useState<string>(formatLocalYYYYMMDD(sevenDaysAgo));
    const [to, setTo] = useState<string>(formatLocalYYYYMMDD(today));

    // Manual insert
    const [recordedAt, setRecordedAt] = useState<string>('');
    const [speed, setSpeed] = useState<string>('0');
    const [note, setNote] = useState<string>('');

    const [daily, setDaily] = useState<VitesseDailyPoint[]>([]);
    const [summary, setSummary] = useState<VitesseSummary | null>(null);
    const [list, setList] = useState<PagedResponse<VitesseEntry> | null>(null);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const LIMIT = 5;

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
            const [dailyRes, summaryRes, listRes] = await Promise.all([
                apiFetch<VitesseDailyPoint[]>(`/api/vitesse/daily?${queryString}`),
                apiFetch<VitesseSummary>(`/api/vitesse/summary?${queryString}`),
                apiFetch<PagedResponse<VitesseEntry>>(`/api/vitesse?${queryString}&page=${page}&limit=${LIMIT}`),
            ]);
            setDaily(dailyRes);
            setSummary(summaryRes);
            setList(listRes);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Erreur lors du chargement des vitesses';
            setErr(msg);
        } finally {
            setLoading(false);
        }
    }, [queryString, page]);

    useEffect(() => {
        load();
    }, [load]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [queryString]);

    async function onCreate(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);

        const speedNum = Number(speed);
        if (Number.isNaN(speedNum) || speedNum < 0) {
            setErr('La vitesse doit être un nombre >= 0');
            return;
        }

        try {
            await apiFetch('/api/vitesse', {
                method: 'POST',
                body: JSON.stringify({
                    recordedAt: recordedAt || undefined,
                    speed: speedNum,
                    note: note || undefined,
                }),
            });

            setRecordedAt('');
            setSpeed('0');
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

            {/* Chart Card */}
            <div className="glass rounded-2xl overflow-hidden shadow-2xl mb-8 p-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-lg font-bold text-white">Vitesse de production par jour</h2>
                        <p className="text-xs text-slate-400 mt-1">Courbe journalière (Moyenne + Max)</p>
                    </div>

                    <div className="flex gap-3 items-end flex-wrap">
                        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                            Début
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="mt-1 w-full bg-white/[0.04] border border-white/[0.08] text-slate-200 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all dark:[color-scheme:dark]"
                            />
                        </label>

                        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
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
                            fileName="vitesse_journaliere_export"
                            sheetName="Vitesse"
                            label="Exporter excel"
                        />

                        <div className="flex gap-2">
                            <KpiCard
                                label="Moyenne"
                                value={summary ? summary.avgSpeed.toFixed(2) : '—'}
                                tone="violet"
                                className="min-w-[100px]"
                                compact
                            />
                            <KpiCard
                                label="Max"
                                value={summary ? summary.maxSpeed.toFixed(2) : '—'}
                                tone="emerald"
                                className="min-w-[100px]"
                                compact
                            />
                        </div>
                    </div>
                </div>

                <div className="h-[320px] w-full">
                    {daily.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={daily} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                                <defs>
                                    <linearGradient id="gradAvg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradMax" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                                />
                                <Tooltip
                                    content={
                                        <TooltipGlass
                                            valueFormatter={(value, key) => [
                                                Number(value ?? 0).toFixed(2),
                                                key === 'avgSpeed' ? 'Moyenne' : 'Max',
                                            ]}
                                        />
                                    }
                                    cursor={{ stroke: 'rgba(6,182,212,0.15)', strokeWidth: 1 }}
                                />

                                {/* Avg area */}
                                <Area
                                    type="monotone"
                                    dataKey="avgSpeed"
                                    name="avgSpeed"
                                    stroke="#06b6d4"
                                    strokeWidth={2.5}
                                    fill="url(#gradAvg)"
                                    dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
                                    activeDot={{ r: 5, fill: '#22d3ee', strokeWidth: 0 }}
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                />

                                {/* Max area */}
                                <Area
                                    type="monotone"
                                    dataKey="maxSpeed"
                                    name="maxSpeed"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#gradMax)"
                                    dot={{ r: 2, fill: '#10b981', strokeWidth: 0 }}
                                    activeDot={{ r: 4, fill: '#34d399', strokeWidth: 0 }}
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

            {/* Manual Insert */}
            <div className="glass rounded-2xl overflow-hidden shadow-2xl p-6 mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Ajouter un échantillon (manuel)</h2>

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
                        Vitesse
                        <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={speed}
                            onChange={(e) => setSpeed(e.target.value)}
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

            {/* List */}
            <div className="glass rounded-2xl overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-5 border-b border-slate-700/50">
                    <h2 className="text-lg font-bold text-white">Derniers échantillons</h2>
                    <div className="text-slate-500 font-medium whitespace-nowrap px-2 text-xs uppercase tracking-wide">
                        Total: <span className="text-slate-200">{list?.total ?? 0}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 bg-slate-800/30">
                                <th className="px-6 py-4">Enregistré le</th>
                                <th className="px-6 py-4">Vitesse</th>
                                <th className="px-6 py-4">Note</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50 text-xs">
                            {!loading && list?.items.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                        Aucune donnée trouvée.
                                    </td>
                                </tr>
                            )}

                            {list?.items.map((v) => (
                                <tr key={v.id} className="group hover:bg-slate-800/40 transition-colors">
                                    <td className="px-6 py-4 font-mono text-slate-300 group-hover:text-white transition-colors">
                                        {formatDateTime(v.recordedAt)}
                                    </td>
                                    <td className="px-6 py-4 text-indigo-200 font-semibold">
                                        {Number(v.speed).toFixed(3)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {v.note ?? ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!loading && list && (
                    <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between items-center bg-slate-800/20">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                            Affichage de {list.items.length} sur {list.total} entrées
                        </div>
                        {list.total > LIMIT && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-lg border border-white/[0.08] text-xs transition-all active:scale-95"
                                >
                                    Précédent
                                </button>
                                <span className="text-xs text-slate-500 py-1">
                                    Page {page} / {Math.ceil(list.total / LIMIT)}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(Math.ceil(list.total / LIMIT), p + 1))}
                                    disabled={page >= Math.ceil(list.total / LIMIT)}
                                    className="px-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 rounded-lg border border-white/[0.08] text-xs transition-all active:scale-95"
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
