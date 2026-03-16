import React from 'react';
import { cn } from '../../utils/cn';

interface PageShellProps {
    children: React.ReactNode;
    /** Container width: 'content' (896px), 'wide' (1024px), 'full' (no max-width) */
    maxWidth?: 'content' | 'wide' | 'full';
    className?: string;
}

/**
 * PageShell - Consistent page container wrapper
 * 
 * Provides standard container widths, page padding, and bottom spacing.
 * Use this to wrap all page content for consistent layout.
 */
export function PageShell({ children, maxWidth = 'content', className }: PageShellProps) {
    const containerClasses = {
        content: 'max-w-4xl',
        wide: 'max-w-5xl',
        full: 'w-full',
    };

    return (
        <div
            className={cn(
                'mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500',
                containerClasses[maxWidth],
                className
            )}
        >
            {children}
        </div>
    );
}
