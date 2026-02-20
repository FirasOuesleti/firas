'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ExcelExportButton from '../components/ExcelExportButton';
// removed Icons import
import Badge from '@/components/ui/Badge';
import { apiFetch } from '@/lib/api';
import type { Cause, PagedResponse } from '@/types/api';

// --- Icons (Inline SVGs) ---
const Icons = {
    Search: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
    ),
    Refresh: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
    ),
    Plus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    ),
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    )
};

// --- Main Component ---
export default function CausesClient() {
    const [data, setData] = useState<PagedResponse<Cause> | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [includeInactive, setIncludeInactive] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State (no more code field)
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [affectTrs, setAffectTrs] = useState(true);
    const [isActive, setIsActive] = useState(true);

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        if (search.trim()) params.set('search', search.trim());
        if (!includeInactive) {
            params.set('isActive', 'true');
        }
        return params.toString();
    }, [search, includeInactive]);

    const load = useCallback(async () => {
        setLoading(true);
        setErr(null);
        try {
            const res = await apiFetch<PagedResponse<Cause>>(`/api/causes?${queryString}`);
            setData(res);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Erreur lors du chargement des causes';
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
        try {
            await apiFetch<Cause>('/api/causes', {
                method: 'POST',
                body: JSON.stringify({
                    name,
                    description: description || null,
                    affectTrs,
                    isActive,
                }),
            });

            // Reset & Close
            setName('');
            setDescription('');
            setAffectTrs(true);
            setIsActive(true);
            setIsModalOpen(false);

            await load();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'La création a échoué';
            setErr(msg);
        }
    }

    async function toggleActive(c: Cause) {
        try {
            await apiFetch<Cause>(`/api/causes/${c.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !c.isActive }),
            });
            await load();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'La mise à jour a échoué';
            setErr(msg);
        }
    }

    return (
        <div className="space-y-6 text-sm">

            {/* Main Card */}
            <div className="glass rounded-2xl overflow-hidden">

                {/* Header Action Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center p-5 border-b border-slate-700/50 gap-4">

                    {/* Left: Add Button & Checkbox */}
                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all active:scale-95 text-xs uppercase tracking-wide"
                        >
                            <Icons.Plus /> Nouvelle Cause
                        </button>

                        <label className="flex items-center gap-3 text-slate-300 cursor-pointer select-none text-xs group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={includeInactive}
                                    onChange={(e) => setIncludeInactive(e.target.checked)}
                                    className="peer sr-only"
                                />
                                <div className="w-9 h-5 bg-white/[0.08] rounded-full peer peer-checked:bg-cyan-600 peer-focus:ring-2 peer-focus:ring-cyan-500/30 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full transition-colors"></div>
                            </div>
                            <span className="group-hover:text-white transition-colors">Inclure Inactifs</span>
                        </label>
                    </div>

                    {/* Right: Search, Refresh, Count */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative group flex-1 md:w-64">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                <Icons.Search />
                            </div>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher causes..."
                                className="w-full bg-white/[0.04] border border-white/[0.08] text-slate-200 pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-slate-600 text-xs"
                            />
                        </div>

                        <button
                            onClick={load}
                            disabled={loading}
                            className="p-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all hover:[&>svg]:rotate-180 [&>svg]:transition-transform [&>svg]:duration-500"
                            title="Actualiser"
                        >
                            <Icons.Refresh />
                        </button>

                        <ExcelExportButton
                            data={(data?.items || []).map(c => ({
                                'Nom': c.name,
                                'Affecte TRS': c.affectTrs ? 'Oui' : 'Non',
                                'Statut': c.isActive ? 'Actif' : 'Inactif',
                                'Description': c.description ?? ''
                            }))}
                            fileName="causes_export"
                            sheetName="Causes"
                            label="Exporter excel"
                        />

                        <div className="text-slate-500 font-medium whitespace-nowrap px-2 text-xs">
                            Total: <span className="text-slate-200">{data?.total ?? 0}</span>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {err && (
                    <div className="bg-red-500/10 border-l-4 border-red-500 p-4 m-4 text-red-400">
                        <strong>Erreur:</strong> {err}
                    </div>
                )}

                {/* Table Content */}
                <div className="overflow-x-auto">
                    {/* Header Row */}
                    <div className="grid grid-cols-[1fr_120px_110px_110px] text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3 border-b border-white/[0.06]">
                        <div className="px-2">Nom</div>
                        <div className="px-2">Affecte TRS</div>
                        <div className="px-2">Statut</div>
                        <div className="px-2 text-right">Actions</div>
                    </div>

                    {/* Rows */}
                    <div className="p-2 space-y-1">
                        {loading && !data && (
                            <div className="px-6 py-8 text-center text-slate-500 text-xs">Chargement...</div>
                        )}

                        {!loading && data?.items.length === 0 && (
                            <div className="px-6 py-8 text-center text-slate-500 text-xs">Aucune cause trouvée.</div>
                        )}

                        {data?.items.map((cause) => (
                            <div
                                key={cause.id}
                                className="group grid grid-cols-[1fr_120px_110px_110px] items-center rounded-xl bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-white/[0.08] hover:shadow-[0_0_20px_rgba(6,182,212,0.06)] transition-all duration-200 text-xs"
                            >
                                <div className="px-4 py-3">
                                    <div className="font-semibold text-slate-200">{cause.name}</div>
                                    {cause.description && (
                                        <div className="text-[10px] text-slate-500 mt-0.5 max-w-xs truncate">{cause.description}</div>
                                    )}
                                </div>

                                <div className="px-4 py-3">
                                    {cause.affectTrs ? (
                                        <Badge variant="amber" glow>OUI</Badge>
                                    ) : (
                                        <Badge variant="neutral">NON</Badge>
                                    )}
                                </div>
                                <div className="px-4 py-3">
                                    {cause.isActive ? (
                                        <Badge variant="emerald" dot>Actif</Badge>
                                    ) : (
                                        <Badge variant="neutral" dot>Inactif</Badge>
                                    )}
                                </div>
                                <div className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => toggleActive(cause)}
                                        className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all font-medium ${cause.isActive
                                            ? 'border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06] hover:ring-1 hover:ring-cyan-500/20'
                                            : 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:ring-1 hover:ring-emerald-500/30'
                                            }`}
                                    >
                                        {cause.isActive ? "Désactiver" : "Activer"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Count */}
                {!loading && data && (
                    <div className="px-6 py-4 border-t border-slate-700/50 flex justify-between items-center bg-slate-800/20">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                            Affichage de {data.items.length} sur {data.total} entrées
                        </div>
                    </div>
                )}
            </div>

            {/* --- Modal --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative bg-slate-900/95 backdrop-blur-xl border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-white/[0.08] flex justify-between items-center bg-white/[0.03]">
                            <h3 className="text-lg font-semibold text-white">Nouvelle Cause</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/[0.08] transition-all">
                                <Icons.Close />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="createForm" onSubmit={onCreate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nom</label>
                                    <input required maxLength={80} value={name} onChange={e => setName(e.target.value)}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-xs placeholder:text-slate-600"
                                        placeholder="Nom de la cause (ex: Panne machine)"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                                    <textarea maxLength={100} value={description} onChange={e => setDescription(e.target.value)}
                                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all h-20 resize-none text-xs placeholder:text-slate-600"
                                        placeholder="Explication détaillée..."
                                    />
                                </div>

                                <div className="flex gap-6 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" checked={affectTrs} onChange={e => setAffectTrs(e.target.checked)} className="peer sr-only" />
                                            <div className="w-9 h-5 bg-white/[0.08] peer-focus:ring-2 peer-focus:ring-cyan-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600 transition-colors"></div>
                                        </div>
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Affecte TRS</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="peer sr-only" />
                                            <div className="w-9 h-5 bg-white/[0.08] peer-focus:ring-2 peer-focus:ring-emerald-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 transition-colors"></div>
                                        </div>
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Actif</span>
                                    </label>
                                </div>
                            </form>
                        </div>

                        <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.03] flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/[0.08] rounded-lg transition-all text-xs uppercase font-medium active:scale-95">
                                Annuler
                            </button>
                            <button form="createForm" type="submit" title="Créer la cause" className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 font-medium transition-all active:scale-95 text-xs uppercase tracking-wide">
                                Créer Cause
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
