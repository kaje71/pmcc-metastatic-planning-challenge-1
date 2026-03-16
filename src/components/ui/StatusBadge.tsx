import React from 'react';
import { cn } from '../../utils/cn';

export type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'ideal' | 'neutral';

interface StatusBadgeProps {
    status: StatusVariant;
    children: React.ReactNode;
    className?: string;
    animate?: boolean;
}

const variants: Record<StatusVariant, string> = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    neutral: "bg-slate-50 text-slate-500 border-slate-200 border-dashed",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
    ideal: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export function StatusBadge({ status, children, className, animate = false }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                variants[status],
                animate && status === 'ideal' && "animate-pulse",
                className
            )}
        >
            {children}
        </span>
    );
}
