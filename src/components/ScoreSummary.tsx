
import { AlertTriangle, CheckCircle2, XCircle, Clock, Trophy, AlertOctagon, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';
import type { ScoreResult } from '../types';

interface Props {
    result: ScoreResult | null;
}

export function ScoreSummary({ result }: Props) {
    if (!result) {
        return (
            <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-xl border border-slate-200 p-8 text-center shadow-sm animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-purple-100 shadow-lg animate-pulse">
                    <Clock className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-lg font-bold text-slate-800">Ready to Score!</p>
                <p className="text-base text-slate-500 mt-2 max-w-[200px] mx-auto">
                    Enter your first DVH value to see your score update in real-time.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-purple-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
            </div>
        );
    }

    const { totalScore, maxPossibleScore, planStatus, failReasons, metricScores, rubricVersion } = result;
    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // Status styling
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PASS': return { color: 'text-pmac-600', icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-100' };
            case 'FAIL': return { color: 'text-rose-600', icon: XCircle, bg: 'bg-rose-50', border: 'border-rose-100' };
            default: return { color: 'text-amber-600', icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-100' };
        }
    };

    const statusInfo = getStatusInfo(planStatus);
    const StatusIcon = statusInfo.icon;

    // Group scores by category
    const categories = [
        { name: 'Target Coverage', scores: metricScores.filter(m => m.id.startsWith('ptv')) },
        { name: 'Spinal canal', scores: metricScores.filter(m => m.id.startsWith('spinal_cord')) },
        { name: 'Lung', scores: metricScores.filter(m => m.id.startsWith('lung')) },
        { name: 'Heart', scores: metricScores.filter(m => m.id.startsWith('heart')) },
        { name: 'Oesophagus', scores: metricScores.filter(m => m.id.startsWith('oesophagus')) },
    ].filter(c => c.scores.length > 0);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 sticky top-24">
            {/* Header / Score Display */}
            <div className={clsx(
                "relative p-6 text-center border-b",
                statusInfo.bg,
                statusInfo.border
            )}>
                <div className="absolute top-4 right-4 text-xs font-mono text-slate-400">v{rubricVersion}</div>

                <div className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm text-sm font-bold tracking-wider uppercase border border-white/50 shadow-sm">
                    <StatusIcon className={clsx("w-3.5 h-3.5", statusInfo.color)} />
                    <span className={statusInfo.color}>{planStatus}</span>
                </div>

                <div className="relative">
                    <div className={clsx("text-6xl font-bold tracking-tighter tabular-nums mb-1", statusInfo.color)}>
                        {totalScore.toFixed(1)}
                    </div>
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
                        Total Points
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 relative h-2.5 bg-black/5 rounded-full overflow-hidden">
                    <div
                        className={clsx("absolute inset-y-0 left-0 transition-all duration-700 ease-out rounded-full",
                            planStatus === 'FAIL' ? 'bg-rose-500' :
                                planStatus === 'INCOMPLETE' ? 'bg-amber-500' : 'bg-pmac-600'
                        )}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>
                <div className="mt-2 text-sm text-right text-slate-500 font-mono">
                    {percentage.toFixed(0)}% of max potential
                </div>
            </div>

            {/* Critical Failures */}
            {failReasons.length > 0 && (
                <div className="px-5 py-4 bg-rose-50 border-b border-rose-100">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-rose-700 uppercase tracking-wider mb-2">
                        <AlertOctagon className="w-4 h-4" />
                        Critical Issues
                    </h4>
                    <ul className="space-y-1.5">
                        {failReasons.map((reason, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-rose-800 leading-snug">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                                {reason}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Breakdown */}
            <div className="p-5 space-y-4">
                {categories.map(category => {
                    const catPoints = category.scores.reduce((sum, s) => sum + s.points, 0);
                    const catMax = category.scores.reduce((sum, s) => sum + s.maxPoints, 0);
                    const catPercent = catMax > 0 ? (catPoints / catMax) * 100 : 0;
                    const isPerfect = catPoints === catMax && catMax > 0;
                    const hasFail = category.scores.some(s => s.status === 'fail');

                    return (
                        <div key={category.name} className="group">
                            <div className="flex justify-between items-center text-base mb-1.5">
                                <span className={clsx(
                                    "font-medium transition-colors",
                                    hasFail ? "text-rose-600" : "text-slate-600"
                                )}>
                                    {category.name}
                                </span>
                                <span className="font-mono text-slate-400 text-sm">
                                    <span className={clsx("text-sm font-bold",
                                        hasFail ? "text-rose-600" :
                                            isPerfect ? "text-pmac-600" : "text-slate-700"
                                    )}>
                                        {catPoints.toFixed(1)}
                                    </span>
                                    <span className="mx-1">/</span>
                                    {catMax.toFixed(1)}
                                </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={clsx("h-full transition-all duration-500 rounded-full",
                                        hasFail ? "bg-rose-500" :
                                            isPerfect ? "bg-pmac-500" : "bg-slate-400"
                                    )}
                                    style={{ width: `${catPercent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Top Improvements - Show metrics with most potential gain */}
            {planStatus !== 'INCOMPLETE' && (() => {
                // Find metrics with most room for improvement (scored, not perfect, not skipped)
                const improvableMetrics = metricScores
                    .filter(m => m.maxPoints > 0 && m.status !== 'skipped' && m.status !== 'incomplete')
                    .map(m => ({
                        ...m,
                        gap: m.maxPoints - m.points,
                        percentage: m.maxPoints > 0 ? (m.points / m.maxPoints) * 100 : 100
                    }))
                    .filter(m => m.gap > 0.1) // Only show if there's meaningful room to improve
                    .sort((a, b) => b.gap - a.gap) // Sort by largest gap first
                    .slice(0, 3); // Top 3 improvements

                if (improvableMetrics.length === 0) return null;

                return (
                    <div className="px-5 py-4 bg-amber-50 border-t border-amber-100">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-amber-700 uppercase tracking-wider mb-3">
                            <TrendingUp className="w-4 h-4" />
                            Top Improvements
                        </h4>
                        <ul className="space-y-2">
                            {improvableMetrics.map(metric => (
                                <li key={metric.id} className="flex items-center justify-between text-sm">
                                    <span className="text-amber-800 font-medium truncate pr-2">
                                        {metric.name}
                                    </span>
                                    <span className="text-amber-600 font-mono text-xs whitespace-nowrap">
                                        +{metric.gap.toFixed(1)} pts possible
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })()}

            {percentage >= 95 && planStatus === 'PASS' && (
                <div className="p-3 bg-indigo-50 border-t border-indigo-100 flex items-center justify-center gap-2 text-pmac-700 text-sm font-bold animate-pulse">
                    <Trophy className="w-4 h-4" />
                    <span>ELITE PLAN</span>
                </div>
            )}
        </div>
    );
}
