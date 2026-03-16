import React from 'react';
import { cn } from '../../utils/cn';

interface KeyValueGridProps {
    /** Number of columns (2 or 3) */
    columns?: 2 | 3;
    /** Items to display */
    items: Array<{
        label: string;
        value: React.ReactNode;
    }>;
    className?: string;
}

/**
 * KeyValueGrid - Structured key-value display
 * 
 * Used for referral snapshots and clinical data displays.
 * Provides consistent label/value styling in a responsive grid.
 */
export function KeyValueGrid({
    columns = 2,
    items,
    className,
}: KeyValueGridProps) {
    const gridClasses = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    };

    return (
        <div className={cn('grid gap-4', gridClasses[columns], className)}>
            {items.map((item, idx) => (
                <div key={idx} className="space-y-1">
                    <dt className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        {item.label}
                    </dt>
                    <dd className="text-sm text-slate-700 font-medium">
                        {item.value}
                    </dd>
                </div>
            ))}
        </div>
    );
}
