/**
 * ScoreCalculator Component - Unified with Scoring Guide
 *
 * Uses official scoring matrix from text/5_calculator.json with:
 * - 23 metrics across 9 structure categories
 * - Bin-based scoring (unacceptable/marginal/acceptable/good/ideal)
 * - Total weight: 150 points
 * - Inline bin thresholds for immediate visual feedback
 */

import React, { useState, useEffect, useMemo, useCallback, useId } from 'react';
import { Save, RefreshCw, ArrowDown, ArrowUp, Loader2, Calculator, Download } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from './ui/Button';
import { Callout } from './ui/Callout';
import { StatusIcon } from './ui/StatusIcon';
import { useToast } from './ui/useToast';
import { MarkdownBlocks } from './content/MarkdownBlocks';
import { SectionCard } from './ui/SectionCard';

import { PageHero } from './ui/PageHero';
import {
    loadScoringMatrix,
    calculateScore,
    validateInput,
    crossFieldValidate,
} from '../engine/scoringEngine';
import type { InputValidationWarning, CrossFieldWarning } from '../engine/scoringEngine';

import { checkForIdentifiers } from '../utils/identifierCheck';
import { loadAttempts, saveAttempts } from '../utils/storage';
import { getRubricVersion } from '../data/config';
import {
    STRUCTURE_DISPLAY_NAMES,
    BIN_ORDER,
    BIN_COLORS,
    BIN_LABELS,
    formatThreshold,
} from '../data/scoringDisplay';
import type {
    ScoringMatrix,
    ScoringResult,
    MetricScoreResult,
} from '../types/scoringTypes';

// Calculator-page section type (from 5_calculator.json → calculator_page.sections)
interface CalcPageSection {
    id: string;
    title: string;
    body_markdown_lines: string[];
}

// Category groupings for visual organization
const CATEGORY_ORDER = [
    { label: 'Target Volumes', structures: ['iGTV_Tumour', 'iGTV_Mediastinal_Node', 'iGTV_Hilar_Node_L', 'PTV_4000'] },
    { label: 'Spinal Canal', structures: ['SpinalCanal', 'SpinalCanal_PRV'] },
    { label: 'Lungs', structures: ['Lungs-iGTV'] },
    { label: 'Heart', structures: ['Heart'] },
    { label: 'Oesophagus', structures: ['Esophagus'] },
    { label: 'Plan Quality', structures: ['Patient-PTV4000'] },
    { label: 'Deliverability Gates', structures: ['Deliverability'] },
    { label: 'Reporting Only', structures: ['Trachea', 'BrachialPlexus_R_05'] },
];

// Sections to show ABOVE the calculator table
const SECTIONS_ABOVE = ['intro', 'how_it_works', 'how_to_measure'];
// Sections to show BELOW the calculator table
const SECTIONS_BELOW = ['interpretation', 'history', 'disclaimer', 'reflection_prompts'];

export function ScoreCalculator() {
    const baseId = useId();
    const { showToast } = useToast();

    // State
    const [matrix, setMatrix] = useState<ScoringMatrix | null>(null);
    const [calcSections, setCalcSections] = useState<CalcPageSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inputs, setInputs] = useState<Record<number, string>>({});
    const [notes, setNotes] = useState('');

    const rubricVersion = getRubricVersion();
    const handleViewHistory = useCallback(() => {
        if (typeof window === 'undefined') return;
        window.dispatchEvent(new CustomEvent('pal:navigate', { detail: 'history' }));
    }, []);


    // Load scoring matrix and calculator-page sections on mount
    useEffect(() => {
        import('../../text/5_calculator.json', { with: { type: 'json' } })
            .then((mod) => {
                const data = mod.default as Record<string, unknown>;
                const cpSections = (data as { calculator_page?: { sections?: CalcPageSection[] } })
                    .calculator_page?.sections ?? [];
                setCalcSections(cpSections);
            })
            .catch(() => { /* calculator_page sections are optional */ });

        loadScoringMatrix()
            .then(setMatrix)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);



    // Convert string inputs to numbers for scoring
    const numericInputs = useMemo((): Record<number, number | null> => {
        const result: Record<number, number | null> = {};
        for (const [id, value] of Object.entries(inputs)) {
            const num = parseFloat(value);
            result[Number(id)] = value === '' || isNaN(num) ? null : num;
        }
        return result;
    }, [inputs]);

    // Calculate score
    const result = useMemo((): ScoringResult | null => {
        if (!matrix) return null;
        return calculateScore(numericInputs, matrix);
    }, [matrix, numericInputs]);

    // Input range validation warnings
    const inputWarnings = useMemo((): Record<number, InputValidationWarning> => {
        if (!matrix) return {};
        const warnings: Record<number, InputValidationWarning> = {};
        for (const metric of matrix.metrics) {
            const val = numericInputs[metric.id];
            if (val !== null && val !== undefined) {
                const warning = validateInput(val, metric);
                if (warning) warnings[metric.id] = warning;
            }
        }
        return warnings;
    }, [matrix, numericInputs]);

    // Cross-field validation warnings
    const crossFieldWarnings = useMemo((): CrossFieldWarning[] => {
        if (!matrix) return [];
        return crossFieldValidate(numericInputs, matrix);
    }, [matrix, numericInputs]);

    // Handle input change
    const handleChange = useCallback((metricId: number, value: string) => {
        setInputs(prev => ({ ...prev, [metricId]: value }));
    }, []);

    // Handle save
    const handleSave = useCallback(() => {
        if (!result || result.planStatus === 'INCOMPLETE') return;

        const identifierCheck = checkForIdentifiers(notes);
        if (identifierCheck.hasIdentifier) {
            showToast({
                type: 'error',
                title: 'Notes blocked',
                message: identifierCheck.message,
            });
            return;
        }

        // Store in localStorage
        const attempt = {
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `attempt_${Date.now()}`,
            timestamp: new Date().toISOString(),
            rubricVersion,
            inputs: numericInputs,
            result,
            notes: notes.trim() || undefined,
        };

        const history = loadAttempts();
        history.push(attempt);
        saveAttempts(history);

        showToast({
            type: 'success',
            title: 'Attempt Saved',
            message: `Score: ${result.totalScore.toFixed(1)} / ${result.maxScore.toFixed(0)} pts (${result.percentage.toFixed(1)}%)`,
        });
    }, [result, numericInputs, notes, showToast, rubricVersion]);

    // Keyboard shortcut: Ctrl+S / Cmd+S to save
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSave]);

    // Export current attempt as CSV
    const handleExportCSV = useCallback(() => {
        if (!result || !matrix) return;

        const rows: string[][] = [
            ['Structure', 'Metric', 'Unit', 'Value', 'Bin', 'Weight', 'Score', 'Max Score'],
        ];

        for (const ms of result.metricScores) {
            const metric = matrix.metrics.find(m => m.id === ms.id);
            if (!metric) continue;
            const structureName = STRUCTURE_DISPLAY_NAMES[metric.structure] ?? metric.structure;
            rows.push([
                structureName,
                metric.statistic,
                metric.unit ?? '',
                ms.value != null ? String(ms.value) : '',
                ms.binLabel,
                String(metric.weight),
                String(ms.points),
                String(metric.weight),
            ]);
        }

        rows.push([]);
        rows.push(['Total Score', '', '', '', '', '', String(result.totalScore.toFixed(1)), String(result.maxScore.toFixed(0))]);
        rows.push(['Percentage', '', '', '', '', '', `${result.percentage.toFixed(1)}%`, '']);
        rows.push(['Plan Status', '', '', '', '', '', result.planStatus, '']);
        rows.push(['Rubric Version', '', '', '', '', '', rubricVersion, '']);
        rows.push(['Exported', '', '', '', '', '', new Date().toISOString(), '']);

        if (notes.trim()) {
            rows.push(['Notes', '', '', '', '', '', `"${notes.trim().replace(/"/g, '""')}"`, '']);
        }

        const csvContent = rows.map(r => r.map(c => {
            if (c.includes(',') || c.includes('"') || c.includes('\n')) {
                return `"${c.replace(/"/g, '""')}"`;
            }
            return c;
        }).join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `plan_score_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        showToast({
            type: 'success',
            title: 'CSV exported',
            message: 'Your scored attempt has been downloaded.',
        });
    }, [result, matrix, notes, rubricVersion, showToast]);

    // Get score result for a metric
    const getMetricScore = (metricId: number): MetricScoreResult | undefined => {
        return result?.metricScores.find(m => m.id === metricId);
    };

    // Map status to StatusIcon type
    const mapStatus = (status: string): 'pass' | 'warning' | 'fail' | 'incomplete' => {
        switch (status) {
            case 'pass': return 'pass';
            case 'warning': return 'warning';
            case 'fail': return 'fail';
            default: return 'incomplete';
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
        );
    }

    // Error state
    if (error || !matrix) {
        return (
            <Callout variant="error" title="Failed to Load Scoring Matrix">
                {error || 'Unknown error'}
            </Callout>
        );
    }

    const canSave = result && result.planStatus !== 'INCOMPLETE';
    const hasGateFailure = result?.hardGateFailed ?? false;
    const gateFailureNames = result?.hardGateFailures
        ?.map(m => STRUCTURE_DISPLAY_NAMES[m.structure] || m.structure)
        .join(', ');
    const gateFailureText = gateFailureNames ? ` (${gateFailureNames})` : '';
    const planStatusLabel = result
        ? result.planStatus === 'UNACCEPTABLE' && result.hardGateFailed
            ? 'GATE FAIL'
            : result.planStatus
        : 'INCOMPLETE';

    // Missing-fields indicator (exclude reporting-only metrics)
    const scoredMetrics = matrix.metrics.filter(m => !m.reporting_only);
    const totalMetrics = scoredMetrics.length;
    const filledCount = scoredMetrics.filter(m => {
        const v = inputs[m.id];
        return v !== undefined && v !== '' && !isNaN(parseFloat(v));
    }).length;
    const missingCount = totalMetrics - filledCount;

    return (
        <div className="stack-lg">
            {/* Page Hero */}
            <PageHero
                eyebrow="Score Calculator"
                eyebrowIcon={Calculator}
                title={matrix.challenge.name}
                subtitle={`${matrix.challenge.prescription.total_dose_Gy} Gy in ${matrix.challenge.prescription.fractions} fractions • ${matrix.metrics.length} metrics • ${matrix.challenge.scoring.total_weight} total points`}
                variant="tinted"
            />

            {/* Main Content Area */}
            <div className="flex flex-col xl:flex-row gap-6 items-start">
                {/* Left Column - Calculator */}
                <div className="flex-1 w-full stack">



                    {hasGateFailure && (
                        <Callout
                            variant="error"
                            title="Safety gate failed"
                            role="alert"
                        >
                            One or more hard-gate metrics are unacceptable{gateFailureText}. This is non-acceptable for the challenge. Review spinal canal/PRV constraints before submission.
                        </Callout>
                    )}

                    {crossFieldWarnings.length > 0 && (
                        <Callout variant="warning" title="Cross-field validation warning">
                            {crossFieldWarnings.map((w, i) => (
                                <p key={i} className="text-sm">{w.message}</p>
                            ))}
                        </Callout>
                    )}

                    {/* Calculator-page guidance sections (above table) */}
                    {calcSections
                        .filter(s => SECTIONS_ABOVE.includes(s.id))
                        .map(section => (
                            <SectionCard
                                key={section.id}
                                title={section.title}
                                variant="tinted"
                                tintColor="purple"
                            >
                                <MarkdownBlocks lines={section.body_markdown_lines} />
                            </SectionCard>
                        ))
                    }

                    {/* Evidence alignment callout (item 1.7) */}
                    {calcSections
                        .filter(s => s.id === 'evidence_alignment')
                        .map(section => (
                            <Callout key={section.id} variant="info" title={section.title}>
                                <MarkdownBlocks lines={section.body_markdown_lines} />
                            </Callout>
                        ))
                    }

                    {/* Metrics Table with Inline Bins */}
                    <div id="calculator-inputs" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                Scoring Inputs
                            </h3>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setInputs({});
                                    setNotes('');
                                }}
                                className="h-8 px-3 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            >
                                <RefreshCw className="h-3 w-3 mr-1.5" />
                                Clear all
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <caption className="sr-only">Scoring calculator: enter DVH metric values to calculate your plan score across {matrix.metrics.length} metrics</caption>
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                                        <th scope="col" className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide min-w-[200px]">Structure / Metric</th>
                                        {BIN_ORDER.map(binKey => (
                                            <th
                                                key={binKey}
                                                scope="col"
                                                className={clsx(
                                                    "text-center py-2 px-2 font-semibold text-xs min-w-[70px]",
                                                    BIN_COLORS[binKey].headerBg,
                                                    BIN_COLORS[binKey].headerText
                                                )}
                                            >
                                                {BIN_LABELS[binKey].short}
                                            </th>
                                        ))}
                                        <th scope="col" className="text-center py-3 px-2 font-semibold text-xs uppercase tracking-wide w-28">Value</th>
                                        <th scope="col" className="text-center py-3 px-2 font-semibold text-xs uppercase tracking-wide w-20">Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {CATEGORY_ORDER.map(category => {
                                        // Get all metrics for structures in this category
                                        const categoryMetrics = matrix.metrics.filter(m =>
                                            category.structures.includes(m.structure)
                                        );

                                        if (categoryMetrics.length === 0) return null;

                                        return (
                                            <React.Fragment key={category.label}>
                                                {/* Category Header */}
                                                <tr className="bg-purple-50 border-y border-purple-200">
                                                    <td colSpan={8} className="py-2 px-4">
                                                        <span className="font-semibold text-purple-800 text-sm">
                                                            {category.label}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* Metrics */}
                                                {categoryMetrics.map(metric => {
                                                    const score = getMetricScore(metric.id);
                                                    const isReporting = metric.reporting_only;
                                                    const currentBin = score?.binLabel || 'incomplete';
                                                    const rowColors = BIN_COLORS[currentBin] || BIN_COLORS.incomplete;
                                                    const fieldId = `${baseId}-metric-${metric.id}`;
                                                    const direction = metric.direction;
                                                    const DirectionIcon = direction === 'lower_is_better' ? ArrowDown : ArrowUp;
                                                    const hasValue = inputs[metric.id] !== undefined && inputs[metric.id] !== '';

                                                    return (
                                                        <tr
                                                            key={metric.id}
                                                            className={clsx(
                                                                "border-b border-slate-100 hover:bg-slate-50/50 transition-colors",
                                                                isReporting && "bg-slate-50/30"
                                                            )}
                                                        >
                                                            {/* Structure + Metric */}
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="flex-1">
                                                                        <div className="font-semibold text-slate-900">
                                                                            {STRUCTURE_DISPLAY_NAMES[metric.structure] || metric.structure}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className="text-slate-600 font-mono text-xs">
                                                                                {metric.statistic}
                                                                            </span>
                                                                            {!isReporting && (
                                                                                <>
                                                                                    <DirectionIcon className="w-3 h-3 text-slate-400" />
                                                                                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-slate-800 text-white font-bold text-[10px]">
                                                                                        {metric.weight} pts
                                                                                    </span>
                                                                                    {metric.id === 11 && (
                                                                                        <span className="text-[10px] text-slate-500 italic ml-1 max-w-[120px] leading-tight flex-shrink">
                                                                                            (low weight — typically not achievable for this anatomy)
                                                                                        </span>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                            {isReporting && (
                                                                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-500 font-semibold text-[10px]">
                                                                                    Report only
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {!isReporting && score && score.status !== 'incomplete' && (
                                                                        <StatusIcon status={mapStatus(score.status)} size="sm" />
                                                                    )}
                                                                </div>
                                                            </td>

                                                            {/* Bin threshold cells or merged reporting cell */}
                                                            {isReporting ? (
                                                                <td colSpan={5} className="py-2 px-2 text-center text-xs text-slate-400 italic">
                                                                    Value recorded for reference — not scored
                                                                </td>
                                                            ) : (
                                                                BIN_ORDER.map(binKey => {
                                                                    const bin = metric.bins.find(b => b.label === binKey);
                                                                    const colors = BIN_COLORS[binKey];
                                                                    const isActive = hasValue && currentBin === binKey;

                                                                    if (!bin) {
                                                                        return (
                                                                            <td
                                                                                key={binKey}
                                                                                className="py-2 px-2 text-center bg-slate-50/50 text-slate-300 text-xs"
                                                                            >
                                                                                -
                                                                            </td>
                                                                        );
                                                                    }

                                                                    const threshold = metric.boolean_input
                                                                        ? (binKey === 'unacceptable' ? 'Yes' : 'No')
                                                                        : formatThreshold(bin, metric.direction);

                                                                    return (
                                                                        <td
                                                                            key={binKey}
                                                                            className={clsx(
                                                                                "py-2 px-2 text-center font-mono text-xs transition-all",
                                                                                isActive
                                                                                    ? colors.bgActive
                                                                                    : colors.bg,
                                                                                colors.text,
                                                                                isActive && "font-bold"
                                                                            )}
                                                                        >
                                                                            {threshold}
                                                                        </td>
                                                                    );
                                                                })
                                                            )}

                                                            {/* Input */}
                                                            <td className="py-3 px-2">
                                                                <div className="relative">
                                                                    <label htmlFor={fieldId} className="sr-only">
                                                                        {STRUCTURE_DISPLAY_NAMES[metric.structure] || metric.structure} {metric.statistic} ({metric.unit})
                                                                    </label>
                                                                    {metric.boolean_input ? (
                                                                        <select
                                                                            id={fieldId}
                                                                            value={inputs[metric.id] !== undefined ? inputs[metric.id] : ''}
                                                                            onChange={(e) => handleChange(metric.id, e.target.value)}
                                                                            aria-invalid={inputWarnings[metric.id] ? 'true' : undefined}
                                                                            aria-describedby={inputWarnings[metric.id] ? `${fieldId}-warning` : undefined}
                                                                            className={clsx(
                                                                                "w-full text-center pl-2 pr-6 py-2 text-sm font-bold border-2 rounded-lg transition-all appearance-none bg-no-repeat",
                                                                                "bg-white",
                                                                                "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500",
                                                                                inputWarnings[metric.id]
                                                                                    ? "border-amber-400 bg-amber-50"
                                                                                    : rowColors.border
                                                                            )}
                                                                            style={{ backgroundPosition: 'right 0.5rem center', backgroundSize: '1.2em 1.2em', backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3A%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3A%2224%22%20height%3A%2224%22%20viewBox%3A%220%200%2024%2024%22%20fill%3A%22none%22%20stroke%3A%22%2364748b%22%20stroke-width%3A%222%22%20stroke-linecap%3A%22round%22%20stroke-linejoin%3A%22round%22%3E%3Cpolyline%20points%3A%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")' }}
                                                                        >
                                                                            <option value="">--</option>
                                                                            <option value="1">Yes</option>
                                                                            <option value="0">No</option>
                                                                        </select>
                                                                    ) : (
                                                                        <input
                                                                            id={fieldId}
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            value={inputs[metric.id] || ''}
                                                                            onChange={(e) => handleChange(metric.id, e.target.value)}
                                                                            placeholder="--"
                                                                            aria-invalid={inputWarnings[metric.id] ? 'true' : undefined}
                                                                            aria-describedby={inputWarnings[metric.id] ? `${fieldId}-warning` : undefined}
                                                                            className={clsx(
                                                                                "w-full text-center px-2 py-2 text-sm font-bold border-2 rounded-lg transition-all",
                                                                                "bg-white placeholder:text-slate-300",
                                                                                "focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-purple-500",
                                                                                inputWarnings[metric.id]
                                                                                    ? "border-amber-400 bg-amber-50"
                                                                                    : isReporting ? "border-slate-200" : rowColors.border
                                                                            )}
                                                                        />
                                                                    )}
                                                                    {!metric.boolean_input && (
                                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                                                                            {metric.unit}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {inputWarnings[metric.id] && (
                                                                    <p id={`${fieldId}-warning`} className="text-[10px] text-amber-600 mt-0.5 leading-tight">
                                                                        {inputWarnings[metric.id].message}
                                                                    </p>
                                                                )}
                                                            </td>

                                                            {/* Score */}
                                                            <td className="py-3 px-2 text-center">
                                                                {isReporting ? (
                                                                    <span className="text-xs text-slate-400 italic">—</span>
                                                                ) : score ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={clsx("text-sm font-bold", rowColors.text)}>
                                                                            {score.points.toFixed(1)}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            / {score.maxPoints}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-300">--</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <label htmlFor={`${baseId}-notes`} className="block text-sm font-bold text-slate-700 mb-2">
                            Planning Notes (Optional)
                        </label>
                        <textarea
                            id={`${baseId}-notes`}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Planning trade-offs and learning points."
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm
                            focus:ring-2 focus:ring-purple-500 focus:border-purple-300 outline-none
                            min-h-[80px] resize-y placeholder:text-slate-400"
                        />
                    </div>

                    {/* Calculator-page guidance sections (below table) */}
                    {calcSections
                        .filter(s => SECTIONS_BELOW.includes(s.id))
                        .map(section => (
                            <SectionCard
                                key={section.id}
                                title={section.title}
                                variant={section.id === 'disclaimer' ? 'highlighted' : 'tinted'}
                                tintColor={section.id === 'disclaimer' ? 'amber' : 'purple'}
                            >
                                <MarkdownBlocks lines={section.body_markdown_lines} />
                            </SectionCard>
                        ))
                    }

                    {/* History access */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center justify-between gap-4">
                        <div>
                            <div className="text-sm font-bold text-slate-700">Attempt history</div>
                            <p className="text-xs text-slate-500 mt-1">
                                Review saved scores and compare past plans.
                            </p>
                        </div>
                        <Button variant="secondary" onClick={handleViewHistory}>
                            View history
                        </Button>
                    </div>

                    {/* Mobile Save */}
                    <div className="xl:hidden">
                        <Button
                            onClick={handleSave}
                            disabled={!canSave}
                            className="w-full h-12 text-lg font-bold"
                            variant={canSave ? 'primary' : 'secondary'}
                        >
                            <Save className="mr-2 h-5 w-5" />
                            SAVE ATTEMPT
                        </Button>
                    </div>

                    {/* Mobile Floating Score Bar */}
                    {result && (
                        <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-4 py-3 z-40 flex items-center justify-between shadow-lg" aria-live="polite">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-slate-900">{result.totalScore.toFixed(1)}</span>
                                <span className="text-xs text-slate-500">/ {result.maxScore} pts ({result.percentage.toFixed(0)}%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={clsx(
                                    "px-2 py-1 rounded-full text-xs font-bold",
                                    result.planStatus === 'COMPLETE' ? "bg-emerald-100 text-emerald-800" :
                                        result.planStatus === 'UNACCEPTABLE' ? "bg-red-100 text-red-800" :
                                            "bg-slate-100 text-slate-600"
                                )}>{planStatusLabel}</span>
                                <Button onClick={handleSave} disabled={!canSave} variant="primary" className="h-9 px-4 text-sm font-bold">
                                    <Save className="h-4 w-4 mr-1" /> Save
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Summary */}
                <div className="hidden xl:block w-[320px] shrink-0">
                    <div className="sticky top-24 space-y-4">
                        {/* Score Summary */}
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm" aria-live="polite" aria-atomic="true">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
                                Score Summary
                            </h3>

                            {result ? (
                                <div className="space-y-4">
                                    {/* Total Score */}
                                    <div className="text-center">
                                        <div className="text-4xl font-black text-slate-900">
                                            {result.totalScore.toFixed(1)}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            / {result.maxScore} points
                                        </div>
                                        <div className={clsx(
                                            "mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold",
                                            result.percentage >= 80 ? "bg-emerald-100 text-emerald-800" :
                                                result.percentage >= 60 ? "bg-yellow-100 text-yellow-800" :
                                                    result.percentage >= 40 ? "bg-orange-100 text-orange-800" :
                                                        "bg-red-100 text-red-800"
                                        )}>
                                            {result.percentage.toFixed(1)}%
                                        </div>
                                    </div>

                                    {/* Status Breakdown */}
                                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                                        <div className="bg-emerald-50 rounded-lg p-2">
                                            <div className="font-bold text-emerald-700">
                                                {result.metricScores.filter(m => m.binLabel === 'ideal' || m.binLabel === 'good').length}
                                            </div>
                                            <div className="text-emerald-600">Pass</div>
                                        </div>
                                        <div className="bg-yellow-50 rounded-lg p-2">
                                            <div className="font-bold text-yellow-700">
                                                {result.metricScores.filter(m => m.binLabel === 'acceptable' || m.binLabel === 'marginal').length}
                                            </div>
                                            <div className="text-yellow-600">Warning</div>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-2">
                                            <div className="font-bold text-red-700">
                                                {result.metricScores.filter(m => m.binLabel === 'unacceptable').length}
                                            </div>
                                            <div className="text-red-600">Fail</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-2">
                                            <div className="font-bold text-slate-600">
                                                {result.metricScores.filter(m => m.status === 'incomplete').length}
                                            </div>
                                            <div className="text-slate-500">Pending</div>
                                        </div>
                                    </div>

                                    {/* Plan Status */}
                                    <div className={clsx(
                                        "text-center py-2 rounded-lg font-bold text-sm",
                                        result.planStatus === 'COMPLETE' ? "bg-emerald-100 text-emerald-800" :
                                            result.planStatus === 'UNACCEPTABLE' ? "bg-red-100 text-red-800" :
                                                "bg-slate-100 text-slate-600"
                                    )}>
                                        {planStatusLabel}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-slate-400 py-8">
                                    Enter values to see score
                                </div>
                            )}
                        </div>

                        {/* Missing-fields indicator */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Fields completed</span>
                                <span className={clsx(
                                    "text-xs font-bold",
                                    missingCount === 0 ? "text-emerald-600" : "text-amber-600"
                                )}>
                                    {filledCount} / {totalMetrics}
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className={clsx(
                                        "h-full rounded-full transition-all duration-300",
                                        missingCount === 0 ? "bg-emerald-500" : "bg-amber-500"
                                    )}
                                    style={{ width: `${totalMetrics > 0 ? (filledCount / totalMetrics) * 100 : 0}%` }}
                                />
                            </div>
                            {missingCount > 0 && (
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                    {missingCount} metric{missingCount !== 1 ? 's' : ''} remaining
                                </p>
                            )}
                        </div>

                        {/* Save Button */}
                        <Button
                            onClick={handleSave}
                            disabled={!canSave}
                            className="w-full h-12 text-lg font-bold"
                            variant="primary"
                        >
                            <Save className="mr-2 h-5 w-5" />
                            Save Attempt
                        </Button>

                        {/* Export CSV */}
                        <Button
                            onClick={handleExportCSV}
                            disabled={!result}
                            className="w-full"
                            variant="secondary"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </Button>

                        {!canSave && (
                            <div className="p-3 bg-slate-100 text-slate-600 text-xs font-medium text-center rounded-lg">
                                {missingCount > 0
                                    ? `Enter all ${missingCount} remaining metric${missingCount !== 1 ? 's' : ''} to save`
                                    : 'Complete all required fields'}
                            </div>
                        )}

                        {/* Reset */}
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setInputs({});
                                setNotes('');
                            }}
                            className="w-full"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset Form
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

