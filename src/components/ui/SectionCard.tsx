import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SectionCardProps {
    /** Optional section title */
    title?: string;
    /** Optional icon in header pill */
    icon?: LucideIcon;
    /** Icon background color class (e.g., 'bg-blue-100') */
    iconBg?: string;
    /** Icon color class (e.g., 'text-blue-500') */
    iconColor?: string;
    /** Optional right-aligned header actions */
    rightActions?: React.ReactNode;
    /** Card variant: 'default' (white), 'tinted' (gradient header), 'highlighted' (colored border) */
    variant?: 'default' | 'tinted' | 'highlighted';
    /** Tint color for 'tinted' variant: 'purple', 'blue', 'amber', 'emerald', 'slate' */
    tintColor?: 'purple' | 'blue' | 'amber' | 'emerald' | 'slate';
    /** Card content */
    children: React.ReactNode;
    className?: string;
    /** If true, removes internal padding (for custom layouts) */
    noPadding?: boolean;
    /** If true, the section can be collapsed/expanded */
    collapsible?: boolean;
    /** If true, the section starts expanded (only applies if collapsible is true) */
    defaultExpanded?: boolean;
}

const tintStyles = {
    purple: {
        header: 'bg-gradient-to-r from-purple-50 to-slate-50 border-b border-purple-100',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-500',
    },
    blue: {
        header: 'bg-gradient-to-r from-blue-50 to-slate-50 border-b border-blue-100',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-500',
    },
    amber: {
        header: 'bg-gradient-to-r from-amber-50 to-slate-50 border-b border-amber-100',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-500',
    },
    emerald: {
        header: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
    },
    slate: {
        header: 'bg-slate-50 border-b border-slate-200',
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-500',
    },
};

/**
 * SectionCard - Unified content card component
 * 
 * Provides consistent card styling across all pages with optional
 * header section featuring icon pill and title.
 */
export function SectionCard({
    title,
    icon: Icon,
    iconBg,
    iconColor,
    rightActions,
    variant = 'default',
    tintColor = 'purple',
    children,
    className,
    noPadding = false,
    collapsible = false,
    defaultExpanded = false,
}: SectionCardProps) {
    const hasHeader = title || Icon || rightActions;
    const tint = tintStyles[tintColor];
    const [isExpanded, setIsExpanded] = useState(defaultExpanded || !collapsible);

    const cardClasses = cn(
        'bg-white rounded-[--radius-card] border shadow-sm overflow-hidden',
        variant === 'highlighted' && 'border-2 border-emerald-200',
        variant !== 'highlighted' && 'border-slate-200',
        className
    );

    const headerClasses = cn(
        'px-6 py-4 flex items-center justify-between gap-4 transition-colors',
        variant === 'tinted' ? tint.header : 'border-b border-slate-100',
        collapsible && 'cursor-pointer select-none hover:bg-slate-50/70',
        !isExpanded && collapsible && 'border-b-0 border-transparent transition-all'
    );

    const bodyClasses = cn(
        !noPadding && 'px-5 py-5 md:px-6 md:py-6'
    );

    return (
        <div className={cardClasses}>
            {hasHeader && (
                <div 
                    className={headerClasses}
                    onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
                    role={collapsible ? "button" : undefined}
                    aria-expanded={collapsible ? isExpanded : undefined}
                >
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div
                                className={cn(
                                    'p-2 rounded-lg',
                                    iconBg || (variant === 'tinted' ? tint.iconBg : 'bg-slate-100')
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'w-5 h-5',
                                        iconColor || (variant === 'tinted' ? tint.iconColor : 'text-slate-500')
                                    )}
                                />
                            </div>
                        )}
                        {title && (
                            <h2 className="text-lg font-semibold text-slate-900">
                                {title}
                            </h2>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {rightActions && (
                            <div className="flex items-center gap-2">
                                {rightActions}
                            </div>
                        )}
                        {collapsible && (
                            <ChevronDown 
                                className={cn(
                                    "w-5 h-5 text-slate-400 transition-transform duration-200",
                                    !isExpanded && "-rotate-90"
                                )} 
                            />
                        )}
                    </div>
                </div>
            )}
            {isExpanded && (
                <div className={bodyClasses}>
                    {children}
                </div>
            )}
        </div>
    );
}
