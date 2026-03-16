import React from 'react';
import { cn } from '../../utils/cn';
import type { LucideIcon } from 'lucide-react';

interface PageHeroProps {
    /** Optional eyebrow label (e.g., "ANCHOR LITERATURE") */
    eyebrow?: string;
    /** Optional icon for the eyebrow chip */
    eyebrowIcon?: LucideIcon;
    /** Main page title (H1) */
    title: string;
    /** Optional subtitle text */
    subtitle?: string;
    /** Optional right-aligned actions (buttons) */
    rightActions?: React.ReactNode;
    /** Visual variant: 'default' (white) or 'tinted' (subtle gradient) */
    variant?: 'default' | 'tinted';
    /** Optional content to render inside the hero card */
    children?: React.ReactNode;
    className?: string;
}

/**
 * PageHero - Canonical page header pattern
 * 
 * Based on the Anchor Literature page design, this provides a consistent
 * hero section for all pages with optional eyebrow chip, title, subtitle,
 * and action buttons.
 */
export function PageHero({
    eyebrow,
    eyebrowIcon: EyebrowIcon,
    title,
    subtitle,
    rightActions,
    variant = 'default',
    children,
    className,
}: PageHeroProps) {
    const containerStyles = {
        default: 'bg-white border-slate-200',
        tinted: 'bg-gradient-to-r from-purple-50 via-slate-50 to-white border-purple-100',
    };

    return (
        <div
            className={cn(
                'rounded-[--radius-card] border shadow-sm overflow-hidden',
                containerStyles[variant],
                className
            )}
        >
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="space-y-4 flex-1">
                        {/* Eyebrow */}
                        {eyebrow && eyebrow.toLowerCase() !== title.toLowerCase() && (
                            <div className="flex items-center gap-3">
                                <div className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    {EyebrowIcon && <EyebrowIcon className="w-3.5 h-3.5" />}
                                    {eyebrow}
                                </div>
                            </div>
                        )}

                        {/* Title & Subtitle */}
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-tight">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-slate-600 mt-2 text-base md:text-lg max-w-3xl leading-relaxed">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right Actions */}
                    {rightActions && (
                        <div className="flex items-center gap-3 shrink-0">
                            {rightActions}
                        </div>
                    )}
                </div>

                {/* Optional Children Content */}
                {children && (
                    <div className="mt-8 pt-6 border-t border-slate-200/60">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
