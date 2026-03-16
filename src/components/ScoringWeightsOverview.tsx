/**
 * ScoringWeightsOverview Component
 * 
 * Displays a visual breakdown of scoring weights by category,
 * helping users understand point distribution at a glance.
 */

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Target, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import type { ScoringMatrix } from '../types/scoringTypes';

interface CategoryWeights {
    label: string;
    description: string;
    structures: string[];
    totalWeight: number;
    metricCount: number;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: 'target' | 'organ';
}

// Category configuration with colors and icons
const CATEGORY_CONFIG: Omit<CategoryWeights, 'totalWeight' | 'metricCount'>[] = [
    {
        label: 'Target Volumes',
        description: 'PTV, iGTV & iCTV coverage',
        structures: ['iGTV_TUMOR', 'iGTV_MEDIASTINAL_NODE', 'iCTV_TUMOR', 'iCTV_MEDIASTINAL_NODE', 'PTV_4000', 'PTV_COMPOSITE'],
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        borderColor: 'border-purple-300',
        icon: 'target'
    },
    {
        label: 'Lungs',
        description: 'Lung dose sparing',
        structures: ['LUNGS_GTV', 'LUNGS_MINUS_GTV'],
        color: 'text-sky-700',
        bgColor: 'bg-sky-100',
        borderColor: 'border-sky-300',
        icon: 'organ'
    },
    {
        label: 'Heart',
        description: 'Heart sparing',
        structures: ['Heart', 'PERICARDIUM'],
        color: 'text-rose-700',
        bgColor: 'bg-rose-100',
        borderColor: 'border-rose-300',
        icon: 'organ'
    },
    {
        label: 'Oesophagus',
        description: 'Oesophageal sparing',
        structures: ['ESOPHAGUS'],
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        borderColor: 'border-amber-300',
        icon: 'organ'
    },
    {
        label: 'Spinal canal',
        description: 'Canal dose limits',
        structures: ['SPINALCANAL', 'SPINALCANAL_04'],
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-100',
        borderColor: 'border-indigo-300',
        icon: 'organ'
    },
    {
        label: 'Airways',
        description: 'Proximal bronchial tree',
        structures: ['PROXIMAL_BRONCHIAL_TREE'],
        color: 'text-teal-700',
        bgColor: 'bg-teal-100',
        borderColor: 'border-teal-300',
        icon: 'organ'
    },
    {
        label: 'Brachial Plexus',
        description: 'Brachial plexus limits',
        structures: ['BRACHIAL_PLEXUS', 'BRACHIALPLEX_R'],
        color: 'text-fuchsia-700',
        bgColor: 'bg-fuchsia-100',
        borderColor: 'border-fuchsia-300',
        icon: 'organ'
    },
    {
        label: 'Plan Quality',
        description: 'Global dose limits',
        structures: ['GLOBAL', 'BODY_PTV'],
        color: 'text-slate-700',
        bgColor: 'bg-slate-100',
        borderColor: 'border-slate-300',
        icon: 'organ'
    },
];

interface ScoringWeightsOverviewProps {
    matrix: ScoringMatrix;
}

export function ScoringWeightsOverview({ matrix }: ScoringWeightsOverviewProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Calculate weights per category
    const categoryWeights = useMemo((): CategoryWeights[] => {
        return CATEGORY_CONFIG.map(config => {
            const metrics = matrix.metrics.filter(m =>
                config.structures.includes(m.structure)
            );

            return {
                ...config,
                totalWeight: metrics.reduce((sum, m) => sum + m.weight, 0),
                metricCount: metrics.length
            };
        }).filter(cat => cat.totalWeight > 0);
    }, [matrix]);

    const totalPoints = matrix.challenge.scoring.total_weight;

    // Calculate target vs OAR split
    const targetPoints = categoryWeights.find(c => c.label === 'Target Volumes')?.totalWeight || 0;
    const oarPoints = totalPoints - targetPoints;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Collapsible Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-slate-50 border-b border-purple-100 hover:opacity-80 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <Target className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-slate-900">Scoring Weights Overview</h3>
                        <p className="text-xs text-slate-500">
                            {totalPoints} total points across {matrix.metrics.length} metrics
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Quick summary badges */}
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold">
                            Targets: {targetPoints} pts ({((targetPoints / totalPoints) * 100).toFixed(0)}%)
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                            OARs: {oarPoints} pts ({((oarPoints / totalPoints) * 100).toFixed(0)}%)
                        </span>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="border-t border-slate-100 p-4 space-y-4">
                    {/* Visual Weight Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Point Distribution by Category</span>
                            <span className="font-mono">{totalPoints} pts total</span>
                        </div>
                        <div className="flex h-7 rounded-lg overflow-hidden border border-slate-200">
                            {categoryWeights.map((cat, index) => {
                                const widthPercent = (cat.totalWeight / totalPoints) * 100;
                                if (widthPercent < 2) return null; // Skip very small segments

                                return (
                                    <div
                                        key={cat.label}
                                        className={clsx(
                                            "flex items-center justify-center transition-all hover:opacity-80",
                                            cat.bgColor,
                                            index > 0 && "border-l border-white/50"
                                        )}
                                        style={{ width: `${widthPercent}%` }}
                                        title={`${cat.label}: ${cat.totalWeight} pts (${widthPercent.toFixed(1)}%)`}
                                    >
                                        {widthPercent > 10 && (
                                            <span className={clsx("text-[10px] font-bold truncate px-1", cat.color)}>
                                                {cat.totalWeight}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Category Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {categoryWeights.map((cat) => {
                            const percentage = ((cat.totalWeight / totalPoints) * 100).toFixed(1);

                            return (
                                <div
                                    key={cat.label}
                                    className={clsx(
                                        "rounded-lg border p-3 transition-all hover:shadow-sm",
                                        cat.bgColor,
                                        cat.borderColor
                                    )}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <div className={clsx("text-xs font-bold truncate", cat.color)}>
                                            {cat.label}
                                        </div>
                                        {cat.icon === 'target' ? (
                                            <Target className={clsx("w-3.5 h-3.5 flex-shrink-0", cat.color)} />
                                        ) : (
                                            <Activity className={clsx("w-3.5 h-3.5 flex-shrink-0", cat.color)} />
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className={clsx("text-xl font-black", cat.color)}>
                                            {cat.totalWeight}
                                        </span>
                                        <span className={clsx("text-xs opacity-70", cat.color)}>
                                            pts
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 text-[10px] opacity-60">
                                        <span className={cat.color}>{percentage}%</span>
                                        <span className={cat.color}>•</span>
                                        <span className={cat.color}>{cat.metricCount} {cat.metricCount === 1 ? 'metric' : 'metrics'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend / Key Points */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-purple-200 border border-purple-300"></div>
                            <span><strong>Target coverage</strong> accounts for majority of points</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-emerald-200 border border-emerald-300"></div>
                            <span><strong>5 scoring levels:</strong> Ideal → Good → Acceptable → Marginal → Unacceptable</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
