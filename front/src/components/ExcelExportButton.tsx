'use client';

import React from 'react';

/* ── Formula-injection guard ───────────────────────────── */
const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

function sanitizeValue(v: unknown): unknown {
    if (typeof v !== 'string') return v;
    if (v.length > 0 && DANGEROUS_PREFIXES.includes(v[0])) return `'${v}`;
    return v;
}

function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
        out[k] = sanitizeValue(v);
    }
    return out;
}

/* ── Component ─────────────────────────────────────────── */
interface ExcelExportButtonProps {
    data: Record<string, unknown>[];
    fileName: string;
    sheetName?: string;
    label?: string;
    className?: string;
}

export default function ExcelExportButton({
    data,
    fileName,
    sheetName = 'Sheet1',
    label = 'Export Excel',
    className,
}: ExcelExportButtonProps) {
    const handleExport = async () => {
        if (!data || data.length === 0) {
            alert('Aucune donnée à exporter.');
            return;
        }

        // Dynamic import — xlsx is only loaded on click
        const XLSX = await import('xlsx');

        const sanitized = data.map(sanitizeRow);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(sanitized);

        // Heuristic column widths
        const cols = Object.keys(sanitized[0]).map((key) => ({
            wch: Math.max(key.length + 2, 15),
        }));
        ws['!cols'] = cols;

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    };

    return (
        <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all font-medium text-xs ${className ?? ''}`}
            title="Télécharger au format Excel"
        >
            {/* Inline download icon — no lucide dependency */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {label}
        </button>
    );
}
