
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'code' | 'default';
}

export function GlassCard({ className, variant = 'default', children, ...props }: GlassCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300",
                variant === 'default' && "bg-brand-glass border-white/10 text-slate-100",
                variant === 'code' && "bg-black/30 border-white/5 font-mono text-sm",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
