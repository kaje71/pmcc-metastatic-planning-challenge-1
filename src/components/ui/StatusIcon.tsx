/**
 * StatusIcon Component
 * 
 * Provides visual status indicators that don't rely on colour alone.
 * P0 Fix: Add status icons (not colour-only)
 */

import { CheckCircle, AlertTriangle, XCircle, MinusCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';

type StatusType = 'pass' | 'warning' | 'fail' | 'incomplete' | 'skipped';

interface StatusIconProps {
    status: StatusType;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    className?: string;
}

const iconMap = {
    pass: CheckCircle,
    warning: AlertTriangle,
    fail: XCircle,
    incomplete: Clock,
    skipped: MinusCircle,
};

const labelMap = {
    pass: 'Pass',
    warning: 'Warning',
    fail: 'Fail',
    incomplete: 'Incomplete',
    skipped: 'Skipped',
};

const colorMap = {
    pass: 'text-teal-600',
    warning: 'text-amber-600',
    fail: 'text-pink-700',
    incomplete: 'text-slate-400',
    skipped: 'text-slate-400',
};

const sizeMap = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
};

export function StatusIcon({ status, size = 'md', showLabel = false, className }: StatusIconProps) {
    const Icon = iconMap[status];
    const label = labelMap[status];
    const color = colorMap[status];
    const iconSize = sizeMap[size];

    return (
        <span
            className={clsx("inline-flex items-center gap-1", className)}
            role="img"
            aria-label={label}
        >
            <Icon className={clsx(iconSize, color)} aria-hidden="true" />
            {showLabel && (
                <span className={clsx("text-xs font-medium", color)}>{label}</span>
            )}
        </span>
    );
}
