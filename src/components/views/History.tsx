/**
 * History Component
 * 
 * Displays saved attempts with trend chart, personal best, export, and comparison features.
 * Refactored to use Design System components (Phase 5).
 */

import { useState, useMemo, useEffect } from 'react';
import { Download, GitCompare, X, TrendingUp, TrendingDown, Minus, Star, Trash2, AlertTriangle, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import type { SavedAttempt } from '../../types';
import { loadScoringMatrix } from '../../engine/scoringEngine';
import type { ScoringMatrix, ScoringMetric } from '../../types/scoringTypes';
import { clearAttempts } from '../../utils/storage';

// Design System
import { Button } from '../ui/Button';
import { StatusBadge } from '../ui/StatusBadge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/Table';

const STRUCTURE_DISPLAY_NAMES: Record<string, string> = {
    'iGTV_TUMOR': 'iGTV Tumour',
    'iGTV_MEDIASTINAL_NODE': 'iGTV Mediastinal node',
    'iCTV_TUMOR': 'iCTV Tumour',
    'iCTV_MEDIASTINAL_NODE': 'iCTV Mediastinal node',
    'PTV_4000': 'PTV 4000',
    'PTV_COMPOSITE': 'PTV Composite',
    'SPINALCANAL': 'Spinal Canal',
    'SPINALCANAL_04': 'Spinal Canal PRV',
    'BRACHIAL_PLEXUS': 'Brachial Plexus',
    'BRACHIALPLEX_R': 'Brachial Plexus R',
    'ESOPHAGUS': 'Oesophagus',
    'LUNGS_GTV': 'Lungs-GTV',
    'LUNGS_MINUS_GTV': 'Lungs-GTV',
    'Heart': 'Heart',
    'PERICARDIUM': 'Heart',
    'LARYNX': 'Larynx',
    'GLOBAL': 'Global Maximum',
};

interface HistoryProps {
    attempts: SavedAttempt[];
    onResetData?: () => void;
}

// --- Export Logic ---
function exportToCSV(attempts: SavedAttempt[]): void {
    const headers = ['Date', 'Score', 'Max Score', 'Status', 'Rubric Version', 'Notes'];
    const rows = attempts.map(a => [
        new Date(a.timestamp).toISOString(),
        a.result.totalScore.toFixed(2),
        (Number.isFinite(a.result.maxScore) ? a.result.maxScore : 150).toFixed(2),
        formatStatus(a).label,
        a.rubricVersion,
        `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, 'text/csv', 'pal_lung_attempts.csv');
}

function exportToJSON(attempts: SavedAttempt[]): void {
    const jsonContent = JSON.stringify(attempts, null, 2);
    downloadFile(jsonContent, 'application/json', 'pal_lung_attempts.json');
}

function downloadFile(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// --- Visual Components ---

// Simple SVG trend chart
function TrendChart({ attempts }: { attempts: SavedAttempt[] }) {
    if (attempts.length < 2) return null;

    // Reverse to show oldest first for the chart
    const data = [...attempts].reverse();
    const scores = data.map(a => a.result.totalScore);
    const maxScore = Math.max(...scores, 150);
    const minScore = Math.min(...scores, 0);

    // Dynamic range but kept sane
    const yMax = Math.max(maxScore, 150);
    const yMin = Math.max(0, minScore - 10);
    const range = yMax - yMin || 1;

    const width = 600;
    const height = 160;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const points = scores.map((score, i) => ({
        x: padding + (i / (scores.length - 1)) * chartWidth,
        y: padding + chartHeight - ((score - yMin) / range) * chartHeight,
        score,
        date: new Date(data[i].timestamp).toLocaleDateString()
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pmac-accent" />
                Score Trajectory
            </h3>
            <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-full">
                    {/* Grid lines */}
                    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1" />

                    {/* Reference line at 100 */}
                    <line
                        x1={padding}
                        y1={padding + chartHeight - ((100 - yMin) / range) * chartHeight}
                        x2={width - padding}
                        y2={padding + chartHeight - ((100 - yMin) / range) * chartHeight}
                        stroke="#94a3b8"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />

                    {/* Trend line */}
                    <path d={pathD} fill="none" stroke="var(--pmac-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                    {/* Area under curve (optional gradient) */}
                    <path
                        d={`${pathD} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
                        fill="url(#gradient)"
                        opacity="0.1"
                    />
                    <defs>
                        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="var(--pmac-accent)" />
                            <stop offset="100%" stopColor="white" />
                        </linearGradient>
                    </defs>

                    {/* Points */}
                    {points.map((p, i) => (
                        <g key={i} className="group">
                            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="var(--pmac-accent)" strokeWidth="2" className="transition-all group-hover:r-6" />
                            <title>{`${p.date}: ${p.score.toFixed(1)}`}</title>
                            , </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}

function formatStatus(attempt: SavedAttempt): { label: string; badge: 'success' | 'warning' | 'error' | 'neutral' } {
    if (attempt.result.hardGateFailed) {
        return { label: 'GATE FAIL', badge: 'error' };
    }
    if (attempt.result.planStatus === 'INCOMPLETE') {
        return { label: 'INCOMPLETE', badge: 'neutral' };
    }
    if (attempt.result.planStatus === 'UNACCEPTABLE') {
        return { label: 'UNACCEPTABLE', badge: 'error' };
    }
    return { label: 'PASS', badge: 'success' };
}

// Delta indicator component
function DeltaIndicator({ current, previous, lowerIsBetter = false }: { current: number; previous: number; lowerIsBetter?: boolean }) {
    const delta = current - previous;
    if (Math.abs(delta) < 0.01) return <Minus className="w-3 h-3 text-slate-300" />;

    const isImprovement = lowerIsBetter ? delta < 0 : delta > 0;
    const Icon = isImprovement ? TrendingUp : TrendingDown;
    const color = isImprovement ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';

    return (
        <span className={clsx("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono font-medium", color)}>
            <Icon className="w-3 h-3" />
            {delta > 0 ? '+' : ''}{delta.toFixed(1)}
        </span>
    );
}

// Comparison Modal
function getMetricLabel(metric: ScoringMetric): string {
    const structureLabel = STRUCTURE_DISPLAY_NAMES[metric.structure] || metric.structure;
    return `${structureLabel} ${metric.statistic}`;
}

function ComparisonModal({
    attemptA,
    attemptB,
    matrix,
    onClose
}: {
    attemptA: SavedAttempt;
    attemptB: SavedAttempt;
    matrix: ScoringMatrix;
    onClose: () => void;
}) {
    const [older, newer] = new Date(attemptA.timestamp) < new Date(attemptB.timestamp)
        ? [attemptA, attemptB]
        : [attemptB, attemptA];

    const scoreDelta = newer.result.totalScore - older.result.totalScore;
    const improved = scoreDelta > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <GitCompare className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Plan Comparison</h2>
                            <p className="text-xs text-slate-500">Comparing two planning-challenge attempts</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Comparison Summary */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-center py-8">
                    <div className="flex items-center gap-8 md:gap-16">
                        {/* Older */}
                        <div className="text-center opacity-70">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Earlier</div>
                            <div className="text-3xl font-bold text-slate-700">{older.result.totalScore.toFixed(1)}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                                {new Date(older.timestamp).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="flex flex-col items-center gap-2">
                            <div className={clsx(
                                "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold shadow-sm",
                                improved ? "bg-emerald-100 text-emerald-700" : scoreDelta < 0 ? "bg-rose-100 text-rose-700" : "bg-slate-200 text-slate-600"
                            )}>
                                {scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(1)} pts
                            </div>
                            <div className="h-0.5 w-24 bg-slate-200 rounded-full"></div>
                        </div>

                        {/* Newer */}
                        <div className="text-center">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Later</div>
                            <div className="text-3xl font-bold text-slate-900">{newer.result.totalScore.toFixed(1)}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-1">
                                {new Date(newer.timestamp).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metric Comparison Table */}
                <div className="flex-1 overflow-auto p-0">
                    <Table>
                        <TableHeader className="sticky top-0 z-10 shadow-sm">
                            <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-center">Earlier</TableHead>
                                <TableHead className="text-center">Later</TableHead>
                                <TableHead className="text-center">Delta</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {matrix.metrics.map((metric) => {
                                const key = String(metric.id);
                                const oldValue = older.inputs[key];
                                const newValue = newer.inputs[key];
                                const lowerIsBetter = metric.direction === 'lower_is_better';

                                if (typeof oldValue !== 'number' || typeof newValue !== 'number') return null;

                                return (
                                    <TableRow key={metric.id}>
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{getMetricLabel(metric)}</div>
                                            <div className="text-xs text-slate-500">{metric.unit}</div>
                                        </TableCell>
                                        <TableCell className="text-center font-mono text-slate-600">
                                            {oldValue.toFixed(1)}
                                        </TableCell>
                                        <TableCell className="text-center font-mono font-medium text-slate-900">
                                            {newValue.toFixed(1)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DeltaIndicator current={newValue} previous={oldValue} lowerIsBetter={lowerIsBetter} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

// Reset confirmation dialog
function ResetDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 text-rose-600 mb-4">
                    <div className="p-2 bg-rose-50 rounded-full">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Delete History?</h2>
                </div>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    This will permanently delete all your saved attempts and local scores. This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-end">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                    <Button variant="danger" onClick={onConfirm}>Delete All</Button>
                </div>
            </div>
        </div>
    );
}

export function History({ attempts, onResetData }: HistoryProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [comparing, setComparing] = useState<[SavedAttempt, SavedAttempt] | null>(null);
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [matrix, setMatrix] = useState<ScoringMatrix | null>(null);

    useEffect(() => {
        loadScoringMatrix()
            .then(setMatrix)
            .catch(() => setMatrix(null));
    }, []);

    // Find personal best
    const personalBest = useMemo(() => {
        if (attempts.length === 0) return null;
        return attempts.reduce((best, current) =>
            current.result.totalScore > best.result.totalScore ? current : best
        );
    }, [attempts]);

    const toggleSelection = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else if (next.size < 2) {
                next.add(id);
            }
            return next;
        });
    };

    const startComparison = () => {
        if (!matrix) {
            return;
        }
        const selectedAttempts = attempts.filter(a => selected.has(a.id));
        if (selectedAttempts.length === 2) {
            setComparing([selectedAttempts[0], selectedAttempts[1]]);
        }
    };

    const handleReset = () => {
        if (onResetData) {
            onResetData();
        } else {
            clearAttempts();
            window.location.reload();
        }
        setShowResetDialog(false);
    };

    if (attempts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-1 ring-slate-200">
                    <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No attempts yet</h3>
                <p className="text-slate-600 font-medium max-w-sm mx-auto">
                    Complete your first plan calculation to see your history and trends here.
                </p>
            </div>
        );
    }

    return (
        <>
            {comparing && matrix && (
                <ComparisonModal
                    attemptA={comparing[0]}
                    attemptB={comparing[1]}
                    onClose={() => { setComparing(null); setSelected(new Set()); }}
                    matrix={matrix}
                />
            )}

            {showResetDialog && (
                <ResetDialog
                    onConfirm={handleReset}
                    onCancel={() => setShowResetDialog(false)}
                />
            )}

            <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
                {/* Personal Best Banner */}
                {personalBest && (
                    <div className="rounded-xl p-1 bg-gradient-to-r from-amber-200 via-orange-100 to-transparent">
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-amber-100/50 rounded-full ring-1 ring-amber-200">
                                    <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-amber-700/70 uppercase tracking-wider mb-0.5">Personal Best</div>
                                    <div className="text-2xl font-bold text-slate-900">
                                        {personalBest.result.totalScore.toFixed(1)}
                                        <span className="text-sm font-normal text-slate-400 ml-1">pts</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-mono text-slate-500">
                                    {new Date(personalBest.timestamp).toLocaleDateString()}
                                </div>
                                <StatusBadge status={formatStatus(personalBest).badge}>
                                    {formatStatus(personalBest).label}
                                </StatusBadge>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trend Chart */}
                <TrendChart attempts={attempts} />

                {/* Tools Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">History Log</h2>
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                            {attempts.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                        {selected.size === 2 && (
                            <Button onClick={startComparison} variant="primary" size="sm" className="mr-2" disabled={!matrix}>
                                <GitCompare className="w-4 h-4 mr-2" />
                                Compare (2)
                            </Button>
                        )}

                        <Button variant="secondary" size="sm" onClick={() => exportToCSV(attempts)}>
                            <Download className="w-4 h-4 mr-2" /> CSV
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => exportToJSON(attempts)}>
                            <Download className="w-4 h-4 mr-2" /> JSON
                        </Button>

                        <div className="w-px h-6 bg-slate-200 mx-1"></div>

                        <Button variant="ghost" size="sm" onClick={() => setShowResetDialog(true)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                            <Trash2 className="w-4 h-4 mr-2" /> Clear All Data
                        </Button>
                    </div>
                </div>

                {/* Storage Usage Indicator (P1) */}
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
                    <span>{attempts.length} attempt{attempts.length !== 1 ? 's' : ''} stored locally</span>
                    <span className="font-mono">{(JSON.stringify(attempts).length / 1024).toFixed(1)} KB</span>
                </div>

                {/* Attempts Table */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-12 text-center">
                                    <span className="sr-only">Select</span>
                                </TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-center">Score</TableHead>
                                <TableHead className="text-center">vs Best</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="w-1/3">Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {attempts.map((attempt) => {
                                const isPB = attempt.id === personalBest?.id;
                                const isSelected = selected.has(attempt.id);

                                return (
                                    <TableRow
                                        key={attempt.id}
                                        className={clsx(
                                            "cursor-pointer transition-colors",
                                            isSelected && "bg-indigo-50/50 hover:bg-indigo-50",
                                            isPB && !isSelected && "bg-amber-50/30"
                                        )}
                                        onClick={() => toggleSelection(attempt.id)}
                                    >
                                        <TableCell className="text-center p-0">
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(attempt.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 rounded border-slate-300 text-pmac-600 focus:ring-pmac-500"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="font-mono text-sm text-slate-600">
                                                    {new Date(attempt.timestamp).toLocaleString('en-AU', {
                                                        dateStyle: 'short',
                                                        timeStyle: 'short'
                                                    })}
                                                </div>
                                                {isPB && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-bold text-slate-900">
                                                {attempt.result.totalScore.toFixed(1)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {isPB ? (
                                                <span className="text-xs font-medium text-amber-600">PB</span>
                                            ) : personalBest ? (
                                                <DeltaIndicator
                                                    current={attempt.result.totalScore}
                                                    previous={personalBest.result.totalScore}
                                                />
                                            ) : null}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <StatusBadge status={formatStatus(attempt).badge}>
                                                {formatStatus(attempt).label}
                                            </StatusBadge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-slate-500 truncate max-w-[300px]">
                                                {attempt.notes || <span className="opacity-30 italic">No notes</span>}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </>
    );
}
