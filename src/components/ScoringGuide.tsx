/**
 * ScoringGuide Component
 * 
 * A comprehensive visual reference showing all metrics with their
 * performance bin thresholds. Designed to help dosimetrists understand
 * scoring trade-offs before and during treatment planning.
 */

import { useMemo, useState } from 'react';
import { ChevronDown, ArrowUp, ArrowDown, Info, Target, Shield, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import type { ScoringMatrix } from '../types/scoringTypes';
import {
    STRUCTURE_DISPLAY_NAMES,
    BIN_ORDER,
    BIN_COLORS,
    BIN_LABELS,
    formatThreshold,
} from '../data/scoringDisplay';

// Category configuration with grouping - matching ScoringWeightsOverview colors
const CATEGORY_CONFIG = [
    {
        id: 'targets',
        label: 'Target Volumes',
        icon: Target,
        description: 'Coverage metrics for tumour and nodal volumes',
        structures: ['iGTV_TUMOR', 'iGTV_MEDIASTINAL_NODE', 'iCTV_TUMOR', 'iCTV_MEDIASTINAL_NODE', 'PTV_4000', 'PTV_COMPOSITE'],
        headerBg: 'bg-purple-100',
        headerText: 'text-purple-700',
        headerBorder: 'border-purple-300',
        rowBg: 'bg-purple-50/30',
    },
    {
        id: 'spinal',
        label: 'Spinal canal',
        icon: Shield,
        description: 'Critical structure - strict dose limits',
        structures: ['SPINALCANAL', 'SPINALCANAL_04'],
        headerBg: 'bg-indigo-100',
        headerText: 'text-indigo-700',
        headerBorder: 'border-indigo-300',
        rowBg: 'bg-white',
    },
    {
        id: 'airways',
        label: 'Airways',
        icon: Shield,
        description: 'Proximal Bronchial Tree dose limits',
        structures: ['PROXIMAL_BRONCHIAL_TREE'],
        headerBg: 'bg-teal-100',
        headerText: 'text-teal-700',
        headerBorder: 'border-teal-300',
        rowBg: 'bg-white',
    },
    {
        id: 'brachial',
        label: 'Brachial Plexus',
        icon: Shield,
        description: 'Brachial plexus dose limits',
        structures: ['BRACHIAL_PLEXUS', 'BRACHIALPLEX_R'],
        headerBg: 'bg-fuchsia-100',
        headerText: 'text-fuchsia-700',
        headerBorder: 'border-fuchsia-300',
        rowBg: 'bg-white',
    },
    {
        id: 'esophagus',
        label: 'Oesophagus',
        icon: Shield,
        description: 'Reduce acute and late toxicity',
        structures: ['ESOPHAGUS'],
        headerBg: 'bg-amber-100',
        headerText: 'text-amber-700',
        headerBorder: 'border-amber-300',
        rowBg: 'bg-white',
    },
    {
        id: 'lungs',
        label: 'Lungs',
        icon: Shield,
        description: 'Minimise pneumonitis risk',
        structures: ['LUNGS_GTV', 'LUNGS_MINUS_GTV'],
        headerBg: 'bg-sky-100',
        headerText: 'text-sky-700',
        headerBorder: 'border-sky-300',
        rowBg: 'bg-white',
    },
    {
        id: 'heart',
        label: 'Heart',
        icon: Shield,
        description: 'Cardiac dose sparing',
        structures: ['Heart', 'PERICARDIUM'],
        headerBg: 'bg-rose-100',
        headerText: 'text-rose-700',
        headerBorder: 'border-rose-300',
        rowBg: 'bg-white',
    },
    {
        id: 'global',
        label: 'Plan Quality',
        icon: Zap,
        description: 'Overall plan quality metrics',
        structures: ['GLOBAL', 'BODY_PTV'],
        headerBg: 'bg-slate-100',
        headerText: 'text-slate-700',
        headerBorder: 'border-slate-300',
        rowBg: 'bg-white',
    },
];

const BIN_DISPLAY_ORDER = ['unacceptable', 'marginal', 'acceptable', 'good', 'ideal'];

interface ScoringGuideProps {
    matrix: ScoringMatrix;
    onClose?: () => void;
}

// Removed: local formatThreshold  -  now imported from scoringDisplay.ts

export function ScoringGuide({ matrix }: ScoringGuideProps) {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
        new Set(CATEGORY_CONFIG.map(c => c.id))
    );

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedCategories(new Set(CATEGORY_CONFIG.map(c => c.id)));
    };

    const collapseAll = () => {
        setExpandedCategories(new Set());
    };

    // Calculate category weights
    const categoryData = useMemo(() => {
        return CATEGORY_CONFIG.map(cat => {
            const metrics = matrix.metrics.filter(m => cat.structures.includes(m.structure));
            const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);
            return { ...cat, metrics, totalWeight };
        }).filter(cat => cat.metrics.length > 0);
    }, [matrix]);

    const totalPoints = matrix.challenge.scoring.total_weight;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header - Matching ScoringWeightsOverview style */}
            <div className="bg-gradient-to-r from-purple-50 to-slate-50 p-5 border-b border-purple-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-sm">
                            <Info className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-xl font-bold text-slate-900">
                                Scoring Matrix Reference Guide
                            </h2>
                            <p className="text-slate-500 text-sm mt-0.5">
                                All {matrix.metrics.length} metrics with performance bin thresholds • {totalPoints} total points
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={expandAll}
                            className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-all shadow-sm flex items-center gap-2"
                        >
                            Expand All
                        </button>
                        <button
                            onClick={collapseAll}
                            className="px-4 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-all shadow-sm flex items-center gap-2"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>

                {/* Legend bar - Styled like the summary badges in Weights Overview */}
                <div className="flex flex-wrap items-center gap-3 mt-5 pt-5 border-t border-slate-200/60">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Performance Bins:</div>
                    <div className="flex flex-wrap gap-2">
                        {BIN_ORDER.map(binKey => (
                            <div
                                key={binKey}
                                className={clsx(
                                    "px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5",
                                    BIN_COLORS[binKey].headerBg,
                                    BIN_COLORS[binKey].headerText,
                                    BIN_COLORS[binKey].border
                                )}
                            >
                                <span className={clsx("w-2 h-2 rounded-full", BIN_COLORS[binKey].text.replace('text-', 'bg-'))}></span>
                                {BIN_LABELS[binKey].full}
                            </div>
                        ))}
                    </div>
                    <div className="flex-grow"></div>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100">
                            <ArrowUp className="w-3.5 h-3.5 text-purple-600" /> Higher is better
                        </span>
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100">
                            <ArrowDown className="w-3.5 h-3.5 text-emerald-600" /> Lower is better
                        </span>
                    </div>
                </div>
            </div>

            {/* Categories */}
            <div className="divide-y divide-slate-200">
                {categoryData.map(category => {
                    const isExpanded = expandedCategories.has(category.id);

                    return (
                        <div key={category.id}>
                            {/* Category Header - Mirroring Weights Overview Grid Cards */}
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className={clsx(
                                    "w-full flex items-center justify-between px-6 py-4 transition-all hover:bg-opacity-90 group border-b",
                                    category.headerBg,
                                    category.headerBorder
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={clsx("p-2 rounded-lg bg-white/60 shadow-sm ring-1 ring-inset ring-black/5", category.headerText)}>
                                        <category.icon className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <span className={clsx("font-bold text-base block leading-tight", category.headerText)}>
                                            {category.label}
                                        </span>
                                        <span className={clsx("text-xs font-medium opacity-80 block mt-0.5", category.headerText)}>
                                            {category.totalWeight} pts • {category.metrics.length} metrics
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={clsx(
                                        "p-1.5 rounded-full transition-all duration-200",
                                        isExpanded ? "bg-white/40 rotate-180" : "bg-transparent rotate-0",
                                        category.headerText
                                    )}>
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </div>
                            </button>

                            {/* Metrics Table */}
                            {isExpanded && (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest border-b border-slate-200">
                                                <th className="text-left py-3 px-6 w-[280px]">Metric</th>
                                                <th className="text-center py-3 px-2 w-20">Weight</th>
                                                <th className="text-center py-3 px-2 w-10"></th>
                                                {BIN_DISPLAY_ORDER.map(binKey => (
                                                    <th
                                                        key={binKey}
                                                        className={clsx(
                                                            "text-center py-3 px-3",
                                                            BIN_COLORS[binKey].headerText
                                                        )}
                                                    >
                                                        {BIN_LABELS[binKey].short}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {category.metrics.map((metric, idx) => {
                                                const DirectionIcon = metric.direction === 'lower_is_better' ? ArrowDown : ArrowUp;

                                                return (
                                                    <tr
                                                        key={metric.id}
                                                        className={clsx(
                                                            "border-b border-slate-100",
                                                            idx % 2 === 0 ? category.rowBg : "bg-white"
                                                        )}
                                                    >
                                                        {/* Metric name */}
                                                        <td className="py-4 px-6">
                                                            <div className="font-bold text-slate-900 text-sm">
                                                                {STRUCTURE_DISPLAY_NAMES[metric.structure] || metric.structure}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 opacity-80 uppercase tracking-tighter">
                                                                {metric.statistic} • {metric.unit}
                                                            </div>
                                                        </td>

                                                        {/* Weight */}
                                                        <td className="py-4 px-2 text-center">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                                                                {metric.weight}
                                                            </span>
                                                        </td>

                                                        {/* Direction */}
                                                        <td className="py-4 px-2 text-center">
                                                            <DirectionIcon
                                                                className={clsx(
                                                                    "w-4 h-4 mx-auto opacity-70",
                                                                    metric.direction === 'lower_is_better'
                                                                        ? "text-emerald-500"
                                                                        : "text-purple-500"
                                                                )}
                                                            />
                                                        </td>

                                                        {/* Bin thresholds */}
                                                        {BIN_DISPLAY_ORDER.map(binKey => {
                                                            const bin = metric.bins.find(b => b.label === binKey);
                                                            const config = BIN_COLORS[binKey];

                                                            if (!bin) {
                                                                return (
                                                                    <td
                                                                        key={binKey}
                                                                        className="py-4 px-3 text-center bg-slate-50/50 text-slate-200"
                                                                    >
                                                                         - 
                                                                    </td>
                                                                );
                                                            }

                                                            const threshold = formatThreshold(bin, metric.direction);

                                                            return (
                                                                <td
                                                                    key={binKey}
                                                                    className={clsx(
                                                                        "py-4 px-3 text-center font-mono font-bold text-xs border-l border-white/40",
                                                                        config.bg,
                                                                        config.text
                                                                    )}
                                                                >
                                                                    {threshold}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer with key insights */}
            <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-200">
                <div className="text-xs text-slate-600">
                    <div className="flex items-center gap-2 font-bold text-slate-900 mb-3 uppercase tracking-wider text-[10px]">
                        <Info className="w-3.5 h-3.5 text-purple-500" />
                        Key planning insights
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-purple-400 mt-1 flex-shrink-0"></div>
                            <span><strong>Target coverage</strong> is the largest single category; prioritise coverage first</span>
                        </div>
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-slate-500 mt-1 flex-shrink-0"></div>
                            <span><strong>Conformity Number (12 pts)</strong> is a high-weight plan-quality metric</span>
                        </div>
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-sky-400 mt-1 flex-shrink-0"></div>
                            <span><strong>Lungs V16Gy (8 pts)</strong> is the most impactful OAR metric</span>
                        </div>
                        <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-100 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1 flex-shrink-0"></div>
                            <span><strong>Spinal Canal PRV</strong> is pass/fail only - hard constraint</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
