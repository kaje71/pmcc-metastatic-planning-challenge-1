import { cn } from '../../utils/cn';
import type { LucideIcon } from 'lucide-react';

interface EyebrowChipProps {
    /** Label text */
    label: string;
    /** Optional icon */
    icon?: LucideIcon;
    /** Color variant */
    variant?: 'purple' | 'slate' | 'blue' | 'amber' | 'emerald';
    className?: string;
}

const variants = {
    purple: 'bg-purple-100 text-purple-700',
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
};

/**
 * EyebrowChip - Small label chip component
 * 
 * Used for eyebrow labels in heroes and section headers.
 */
export function EyebrowChip({
    label,
    icon: Icon,
    variant = 'purple',
    className,
}: EyebrowChipProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider',
                variants[variant],
                className
            )}
        >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {label}
        </div>
    );
}
