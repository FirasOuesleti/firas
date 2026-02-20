'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ExcelExportButton from '../components/ExcelExportButton';
import SectionHeader from '@/components/ui/SectionHeader';
import Badge from '@/components/ui/Badge';
import CausesAnalytics from '@/components/charts/CausesAnalytics';
import { apiFetch } from '@/lib/api';
import { formatDayFR, formatHMS } from '@/lib/dates';
import type { DailyStopsRow, Stop, PagedResponse } from '@/types/api';

// --- Helper Functions ---


/** Format time value (HH:mm:ss or ISO datetime) to HH:mm:ss */
function fmtTime(val: string | null): string {
    if (!val) return '—';
    // If already HH:mm:ss, return as-is
    if (/^\d{2}:\d{2}:\d{2}$/.test(val)) return val;
    // Fallback: try parsing as date
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Icons
const Icons = {
    Refresh: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
    ),
};

type EquipeValue = '' | 'Equipe 1' | 'Equipe 2' | 'Equipe 3';

export default function StopsClient() {
    // ---- Daily Summary State ----
    const [dailyRows, setDailyRows] = useState<DailyStopsRow[]>([]);
    const [loadingDaily, setLoadingDaily] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // ---- Stop Details State ----
    const [stops, setStops] = useState<Stop[]>([]);
    const [stopsTotal, setStopsTotal] = useState(0);
    const [loadingStops, setLoadingStops] = useState(false);
    const [stopsPage, setStopsPage] = useState(1);
    const STOPS_LIMIT = 10;

    // Filters
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [equipe, setEquipe] = useState<EquipeValue>('Equipe 1');

    // Queries
    const dailyQuery = useMemo(() => {
        const params = new URLSearchParams();
        if (fromDate) params.set('from', fromDate);
        if (toDate) params.set('to', toDate);
        if (equipe) params.set('equipe', equipe);
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }, [fromDate, toDate, equipe]);

    // Reset pages on filter change
    useEffect(() => {
        setStopsPage(1);
    }, [fromDate, toDate, equipe]);

    // ---- Load Daily Summary ----
    const loadDaily = useCallback(async () => {
        setLoadingDaily(true);
        setErr(null);
        try {
            const res = await apiFetch<DailyStopsRow[]>(`/api/stops/analytics/daily${dailyQuery}`);
            setDailyRows(res);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Erreur lors du chargement des arrêts quotidiens';
            setErr(msg);
            setDailyRows([]);
        } finally {
            setLoadingDaily(false);
        }
    }, [dailyQuery]);

    useEffect(() => {
        loadDaily();
    }, [loadDaily]);

    // ---- Load Stop Details ----
    const loadStops = useCallback(async () => {
        setLoadingStops(true);
        try {
            const params = new URLSearchParams();
            if (fromDate) params.set('from', fromDate);
            if (toDate) params.set('to', toDate);
            if (equipe) params.set('equipe', equipe);
            params.set('page', String(stopsPage));
            params.set('limit', String(STOPS_LIMIT));
            const qs = params.toString();
            const res = await apiFetch<PagedResponse<Stop>>(`/api/stops?${qs}`);
            setStops(res.items);
            setStopsTotal(res.total);
        } catch {
            setStops([]);
            setStopsTotal(0);
        } finally {
            setLoadingStops(false);
        }
    }, [fromDate, toDate, equipe, stopsPage]);

    useEffect(() => {
        loadStops();
    }, [loadStops]);

    const stopsTotalPages = Math.max(1, Math.ceil(stopsTotal / STOPS_LIMIT));

    return (
        <div className="text-sm pb-8 space-y-8">
            {err && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 mb-4 text-red-400 rounded-r-lg">
                    <strong>Erreur:</strong> {err}
                </div>
            )}

            {/* Filters Section */}
            <div className="glass rounded-2xl p-5">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col">
                        <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1 px-1">Période de visualisation</label>
                        <div className="flex items-center gap-2 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.08] focus-within:border-cyan-500/40 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
                            <div className="flex flex-col px-2">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Début</span>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    aria-label="Date de début"
                                    className="bg-transparent text-white text-xs focus:outline-none dark:[color-scheme:dark]"
                                />
                            </div>
                            <div className="w-px h-8 bg-white/[0.08]"></div>
                            <div className="flex flex-col px-2">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Fin</span>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    aria-label="Date de fin"
                                    className="bg-transparent text-white text-xs focus:outline-none dark:[color-scheme:dark]"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-1 px-1">Equipe</label>
                        <div className="relative">
                            <select
                                value={equipe}
                                onChange={(e) => setEquipe(e.target.value as EquipeValue)}
                                aria-label="Sélection équipe"
                                className="bg-white/[0.04] border border-white/[0.08] text-white pl-4 pr-9 py-2.5 rounded-xl text-xs focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 appearance-none min-w-[130px] transition-all cursor-pointer"
                            >
                                <option value="Equipe 1">Equipe 1</option>
                                <option value="Equipe 2">Equipe 2</option>
                                <option value="Equipe 3">Equipe 3</option>
                            </select>
                            <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>

                    <div className="flex gap-2 ml-auto">
                        <button
                            onClick={() => { setFromDate(''); setToDate(''); }}
                            className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white rounded-xl border border-white/[0.08] transition-all text-xs font-medium uppercase tracking-wide active:scale-95"
                        >
                            <span className="hidden sm:inline">Effacer</span>
                        </button>
                        <button
                            onClick={() => { loadDaily(); loadStops(); }}
                            disabled={loadingDaily || loadingStops}
                            className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all text-xs font-bold uppercase tracking-wide flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        >
                            <Icons.Refresh />
                            Actualiser
                        </button>
                    </div>
                </div>
            </div>

            {/* ═══════ Résumé Arrêts QUOTIDIEN — 1st ═══════ */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col">
                <SectionHeader
                    title="Résumé Arrêts"
                    subtitle="Résumé quotidien des arrêts"
                    actions={
                        <ExcelExportButton
                            data={dailyRows}
                            fileName="resume_arrets_jour"
                            sheetName="Resume"
                            label="Exporter excel"
                        />
                    }
                />

                <div className="p-4 flex-1 min-h-0">
                    <div className="max-h-[400px] overflow-y-auto relative rounded-md border border-white/[0.06] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead className="sticky top-0 z-20 bg-[#0f172a] shadow-sm border-b border-white/[0.06]">
                                <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Total Arrêt</th>
                                    <th className="px-4 py-3">Total Travail</th>
                                    <th className="px-4 py-3">TRS</th>
                                    <th className="px-4 py-3 text-right">Nb Arrêts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.04]">
                                {loadingDaily && dailyRows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chargement...</td>
                                    </tr>
                                )}
                                {!loadingDaily && dailyRows.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">Aucune donnée trouvée.</td>
                                    </tr>
                                )}
                                {dailyRows.map((r) => {
                                    const trsVal = r.trs ?? 0;
                                    const variant = trsVal >= 85 ? 'emerald' : trsVal >= 50 ? 'amber' : 'red';

                                    return (
                                        <tr key={r.day} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-4 py-3 font-medium text-slate-200">{formatDayFR(r.day)}</td>
                                            <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{formatHMS(r.totalDowntimeSeconds)}</td>
                                            <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{formatHMS(r.totalWorkSeconds)}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={variant as 'emerald' | 'amber' | 'red'} glow>{trsVal.toFixed(1)}%</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-slate-200">{r.stopsCount}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ═══════ Détails Arrêts INDIVIDUELS — 2nd ═══════ */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col">
                <SectionHeader
                    title="Détails Arrêts"
                    subtitle={`Liste des arrêts individuels — ${stopsTotal} résultat${stopsTotal !== 1 ? 's' : ''}`}
                    actions={
                        <ExcelExportButton
                            data={stops.map(s => ({
                                'Date': s.jour,
                                'Début': fmtTime(s.debut),
                                'Fin': fmtTime(s.fin),
                                'Durée': s.duree != null ? formatHMS(s.duree) : '—',
                                'Équipe': s.equipe,
                                'Cause': s.cause?.name ?? '—',
                                'Affecte TRS': s.cause?.affectTrs ? 'Oui' : 'Non',
                            }))}
                            fileName="details_arrets"
                            sheetName="Arrêts"
                            label="Exporter excel"
                        />
                    }
                />

                <div className="overflow-x-auto flex-1">
                    {/* Header */}
                    <div className="grid grid-cols-[100px_80px_80px_80px_90px_1fr_80px] text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 border-b border-white/[0.06]">
                        <div className="px-2">Date</div>
                        <div className="px-2">Début</div>
                        <div className="px-2">Fin</div>
                        <div className="px-2">Durée</div>
                        <div className="px-2">Équipe</div>
                        <div className="px-2">Cause</div>
                        <div className="px-2 text-right">Impact TRS</div>
                    </div>

                    {/* Rows */}
                    <div className="p-2 space-y-1">
                        {loadingStops && stops.length === 0 && (
                            <div className="px-4 py-8 text-center text-slate-500 text-xs">Chargement...</div>
                        )}
                        {!loadingStops && stops.length === 0 && (
                            <div className="px-4 py-8 text-center text-slate-500 text-xs">Aucun arrêt trouvé pour cette période.</div>
                        )}

                        {stops.map((s) => (
                            <div
                                key={s.id}
                                className="grid grid-cols-[100px_80px_80px_80px_90px_1fr_80px] items-center rounded-xl transition-all duration-200 text-xs bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.08]"
                            >
                                <div className="px-4 py-3 font-medium text-slate-200">{formatDayFR(s.jour)}</div>
                                <div className="px-4 py-3 text-slate-400 font-mono text-[11px]">{fmtTime(s.debut)}</div>
                                <div className="px-4 py-3 text-slate-400 font-mono text-[11px]">{fmtTime(s.fin)}</div>
                                <div className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                                    {s.duree != null ? formatHMS(s.duree) : '—'}
                                </div>
                                <div className="px-4 py-3 text-slate-400 text-[11px]">{s.equipe}</div>
                                <div className="px-4 py-3 text-slate-200 font-medium truncate" title={s.cause?.name}>
                                    {s.cause?.name}
                                </div>
                                <div className="px-4 py-3 text-right">
                                    {s.cause?.affectTrs ? (
                                        <Badge variant="amber" glow>Oui</Badge>
                                    ) : (
                                        <Badge variant="neutral">Non</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stop Details Pagination */}
                {stopsTotal > STOPS_LIMIT && (
                    <div className="px-4 py-3 border-t border-white/[0.06] flex justify-between items-center">
                        <button
                            onClick={() => setStopsPage(p => Math.max(1, p - 1))}
                            disabled={stopsPage === 1}
                            className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-slate-300 rounded-lg border border-white/[0.08] text-xs transition-all"
                        >
                            Précédent
                        </button>
                        <span className="text-xs text-slate-500">
                            Page {stopsPage} / {stopsTotalPages}
                        </span>
                        <button
                            onClick={() => setStopsPage(p => Math.min(stopsTotalPages, p + 1))}
                            disabled={stopsPage >= stopsTotalPages}
                            className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-40 text-slate-300 rounded-lg border border-white/[0.08] text-xs transition-all"
                        >
                            Suivant
                        </button>
                    </div>
                )}
            </div>

            {/* ═══════ Analytique globale des causes — 3rd ═══════ */}
            <CausesAnalytics from={fromDate} to={toDate} equipe={equipe} />
        </div>
    );
}
