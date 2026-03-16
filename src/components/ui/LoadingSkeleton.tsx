/**
 * LoadingSkeleton — Animated placeholder UI for loading states.
 * Replaces text-only "Loading..." messages with visual skeletons.
 */

import { clsx } from 'clsx';

interface SkeletonProps {
    className?: string;
}

/** Pulsing rectangular skeleton block */
export function SkeletonBlock({ className }: SkeletonProps) {
    return (
        <div
            className={clsx("animate-pulse bg-slate-200 rounded", className)}
            aria-hidden="true"
        />
    );
}

/** Full-page content skeleton: hero + 3 section cards */
export function PageSkeleton() {
    return (
        <div className="space-y-6" aria-busy="true" aria-label="Loading content">
            {/* Hero skeleton */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-3">
                <SkeletonBlock className="h-4 w-24" />
                <SkeletonBlock className="h-8 w-3/4" />
                <SkeletonBlock className="h-4 w-1/2" />
            </div>
            {/* Section cards */}
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
                    <SkeletonBlock className="h-5 w-48" />
                    <SkeletonBlock className="h-3 w-full" />
                    <SkeletonBlock className="h-3 w-5/6" />
                    <SkeletonBlock className="h-3 w-2/3" />
                </div>
            ))}
        </div>
    );
}
