/**
 * Shared scoring display constants and helpers.
 *
 * Used by ScoreCalculator, ScoringGuide, and ScoringWeightsOverview
 * to ensure a single source of truth for structure names, bin colours,
 * labels, ordering, and threshold formatting.
 */

import type { Bin } from '../types/scoringTypes';

// ── Structure display names ────────────────────────────────────────
// Superset of every structure key that appears in the scoring matrix.

export const STRUCTURE_DISPLAY_NAMES: Record<string, string> = {
    'iGTV_Tumour': 'iGTV Tumour',
    'iGTV_Mediastinal_Node': 'iGTV Mediastinal Node',
    'iGTV_Hilar_Node_L': 'iGTV Hilar Node L',
    'PTV_4000': 'PTV 4000',
    'SpinalCanal': 'Spinal Canal',
    'SpinalCanal_PRV': 'Spinal Canal PRV',
    'Lungs-iGTV': 'Lungs − iGTV',
    'Heart': 'Heart',
    'Esophagus': 'Oesophagus',
    'Patient-PTV4000': 'Patient − PTV4000',
    'Trachea': 'Trachea',
    'BrachialPlexus_R_05': 'Brachial Plexus R (PRV)',
};

// ── Bin ordering ───────────────────────────────────────────────────

export const BIN_ORDER = [
    'unacceptable',
    'marginal',
    'acceptable',
    'good',
    'ideal',
] as const;

export type BinKey = (typeof BIN_ORDER)[number];

// ── Bin labels ─────────────────────────────────────────────────────

export const BIN_LABELS: Record<string, { short: string; full: string }> = {
    unacceptable: { short: 'Fail', full: 'Unacceptable' },
    marginal: { short: 'Marginal', full: 'Marginal' },
    acceptable: { short: 'Accept', full: 'Acceptable' },
    good: { short: 'Good', full: 'Good' },
    ideal: { short: 'Ideal', full: 'Ideal' },
};

// ── Bin colour palette ─────────────────────────────────────────────
// Soft pastel gradients for table cells, plus header variants.

export interface BinColorSet {
    bg: string;
    bgActive: string;
    text: string;
    border: string;
    headerBg: string;
    headerText: string;
}

export const BIN_COLORS: Record<string, BinColorSet> = {
    ideal: {
        bg: 'bg-gradient-to-b from-emerald-50 to-emerald-100/80',
        bgActive: 'bg-emerald-200 ring-2 ring-emerald-400 ring-inset',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        headerBg: 'bg-gradient-to-r from-emerald-100 to-emerald-200',
        headerText: 'text-emerald-800',
    },
    good: {
        bg: 'bg-gradient-to-b from-lime-50 to-lime-100/80',
        bgActive: 'bg-lime-200 ring-2 ring-lime-400 ring-inset',
        text: 'text-lime-700',
        border: 'border-lime-200',
        headerBg: 'bg-gradient-to-r from-lime-100 to-lime-200',
        headerText: 'text-lime-800',
    },
    acceptable: {
        bg: 'bg-gradient-to-b from-amber-50 to-yellow-100/80',
        bgActive: 'bg-amber-200 ring-2 ring-amber-400 ring-inset',
        text: 'text-amber-700',
        border: 'border-amber-200',
        headerBg: 'bg-gradient-to-r from-amber-100 to-yellow-200',
        headerText: 'text-amber-800',
    },
    marginal: {
        bg: 'bg-gradient-to-b from-orange-50 to-orange-100/80',
        bgActive: 'bg-orange-200 ring-2 ring-orange-400 ring-inset',
        text: 'text-orange-700',
        border: 'border-orange-200',
        headerBg: 'bg-gradient-to-r from-orange-100 to-orange-200',
        headerText: 'text-orange-800',
    },
    unacceptable: {
        bg: 'bg-gradient-to-b from-red-50 to-red-100/80',
        bgActive: 'bg-red-200 ring-2 ring-red-400 ring-inset',
        text: 'text-red-700',
        border: 'border-red-200',
        headerBg: 'bg-gradient-to-r from-red-100 to-red-200',
        headerText: 'text-red-800',
    },
    reporting: {
        bg: 'bg-slate-50/50',
        bgActive: 'bg-slate-100',
        text: 'text-slate-500',
        border: 'border-slate-200',
        headerBg: 'bg-slate-100',
        headerText: 'text-slate-600',
    },
    incomplete: {
        bg: 'bg-slate-50',
        bgActive: 'bg-slate-100',
        text: 'text-slate-500',
        border: 'border-slate-200',
        headerBg: 'bg-slate-100',
        headerText: 'text-slate-600',
    },
};

// ── Threshold formatting ───────────────────────────────────────────

/**
 * Format a single bin's primary threshold for display.
 *
 * Prioritises the "active" bound: for higher_is_better metrics, the
 * gte/gt bound comes first; for lower_is_better, the lte/lt bound.
 */
export function formatThreshold(bin: Bin, direction: string): string {
    if (direction === 'higher_is_better') {
        if (bin.gte !== undefined) return `≥ ${bin.gte}`;
        if (bin.gt !== undefined) return `> ${bin.gt}`;
        if (bin.lt !== undefined) return `< ${bin.lt}`;
        if (bin.lte !== undefined) return `≤ ${bin.lte}`;
    } else {
        if (bin.lte !== undefined) return `≤ ${bin.lte}`;
        if (bin.lt !== undefined) return `< ${bin.lt}`;
        if (bin.gt !== undefined) return `> ${bin.gt}`;
        if (bin.gte !== undefined) return `≥ ${bin.gte}`;
    }
    return ' - ';
}
