import * as React from 'react';

import { cn } from '../../utils/cn';

// Note: standardizing on Peter Mac colors
// Primary = pmac-800
// Secondary = white with pmac border

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        // Base styles
        const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pmac-accent)] disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

        // Variants
        const variants = {
            primary: "bg-[var(--pmac-800)] text-white hover:bg-[var(--pmac-900)] shadow-sm",
            secondary: "bg-white text-[var(--pmac-800)] border border-slate-200 hover:bg-slate-50 shadow-sm",
            ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
            danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        };

        // Sizes
        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2 text-sm",
            lg: "h-12 px-8 text-base",
            icon: "h-10 w-10",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading ? (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
