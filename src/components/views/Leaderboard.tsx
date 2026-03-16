import { useEffect, useState } from 'react';
import { Trophy, Medal, Star, Target, Crown, Users } from 'lucide-react';
import { clsx } from 'clsx';
import type { SavedAttempt } from '../../types';
import { GlassCard } from '../ui/GlassCard';

interface LeaderboardProps {
    attempts: SavedAttempt[];
}

interface LeaderboardEntry {
    id: string;
    score: number;
    tier: string;
    rubricVersion: string;
}

type Tier = 'Elite' | 'Expert' | 'Proficient' | 'Developing';

const TIERS: { name: Tier; minScore: number; icon: typeof Trophy; color: string; bgColor: string }[] = [
    { name: 'Elite', minScore: 95, icon: Trophy, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
    { name: 'Expert', minScore: 85, icon: Medal, color: 'text-sky-400', bgColor: 'bg-sky-500/20' },
    { name: 'Proficient', minScore: 70, icon: Star, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { name: 'Developing', minScore: 0, icon: Target, color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
];

function getTier(score: number): typeof TIERS[0] {
    return TIERS.find(t => score >= t.minScore) || TIERS[TIERS.length - 1];
}

export function Leaderboard({ attempts }: LeaderboardProps) {
    const [communityBoard, setCommunityBoard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Find user's personal best
    const personalBest = attempts.length > 0
        ? Math.max(...attempts.map(a => a.result.totalScore))
        : null;

    const userTier = personalBest ? getTier(personalBest) : null;

    // Load community leaderboard (optional static file)
    useEffect(() => {
        fetch('/leaderboard.json')
            .then(res => res.ok ? res.json() : [])
            .then((data: LeaderboardEntry[]) => setCommunityBoard(data))
            .catch(() => setCommunityBoard([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
            {/* Personal Best Section */}
            <GlassCard className="p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/5 to-transparent pointer-events-none" />

                <div className="relative">
                    <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Your Personal Best</h2>

                    {personalBest !== null ? (
                        <>
                            <div className="text-6xl font-bold text-slate-900 tracking-tighter mb-4">
                                {personalBest.toFixed(1)}
                            </div>

                            {userTier && (
                                <div className={clsx(
                                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-sm",
                                    userTier.bgColor, userTier.color
                                )}>
                                    <userTier.icon className="w-5 h-5" />
                                    {userTier.name} Tier
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-slate-600 font-medium">
                            <Target className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                            <p>No attempts saved yet</p>
                            <p className="text-sm mt-1">Complete a score to see your ranking</p>
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Tier Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {TIERS.map(tier => {
                    const TierIcon = tier.icon;
                    const isUserTier = userTier?.name === tier.name;

                    return (
                        <div
                            key={tier.name}
                            className={clsx(
                                "p-4 rounded-xl border text-center transition-all",
                                isUserTier
                                    ? `${tier.bgColor} border-current ${tier.color} ring-2 ring-current/30`
                                    : "bg-white/40 border-slate-200 text-slate-500"
                            )}
                        >
                            <TierIcon className={clsx("w-6 h-6 mx-auto mb-2", isUserTier ? tier.color : "text-slate-400")} />
                            <div className="font-bold text-slate-700">{tier.name}</div>
                            <div className="text-xs font-medium opacity-70">
                                {tier.minScore > 0 ? `≥ ${tier.minScore}` : `< ${TIERS[TIERS.length - 2].minScore}`}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Community Leaderboard */}
            <GlassCard className="overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                    <Users className="w-5 h-5 text-brand-accent" />
                    <h3 className="font-bold text-slate-900">Community Leaderboard</h3>
                    <span className="text-xs font-medium text-slate-500">(Anonymised)</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500 font-medium">Loading...</div>
                ) : communityBoard.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 font-medium">
                        <Crown className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p>No community scores available yet</p>
                        <p className="text-xs mt-1">Organisers will add verified scores after the challenge</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="px-6 py-3 text-left">Rank</th>
                                    <th className="px-6 py-3 text-left">Planner</th>
                                    <th className="px-6 py-3 text-center">Score</th>
                                    <th className="px-6 py-3 text-center">Tier</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {communityBoard
                                    .sort((a, b) => b.score - a.score)
                                    .map((entry, index) => {
                                        const tier = getTier(entry.score);
                                        const TierIcon = tier.icon;
                                        const isTop3 = index < 3;

                                        return (
                                            <tr key={entry.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className={clsx(
                                                        "w-8 h-8 inline-flex items-center justify-center rounded-full font-bold",
                                                        isTop3 ? "bg-brand-accent/20 text-brand-accent" : "bg-white/5 text-slate-400"
                                                    )}>
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-300">{entry.id}</td>
                                                <td className="px-6 py-4 text-center font-bold text-white">{entry.score.toFixed(1)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={clsx("inline-flex items-center gap-1.5 text-xs font-medium", tier.color)}>
                                                        <TierIcon className="w-4 h-4" />
                                                        {tier.name}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
