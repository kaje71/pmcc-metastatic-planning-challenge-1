import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface CalloutProps {
    title?: string;
    children: React.ReactNode;
    variant?: 'info' | 'warning' | 'error' | 'success';
    className?: string;
    role?: string;
}

const variants = {
    info: {
        container: "bg-blue-50 border-blue-200 text-blue-900",
        icon: "text-blue-500",
    },
    warning: {
        container: "bg-amber-50 border-amber-200 text-amber-900",
        icon: "text-amber-500",
    },
    error: {
        container: "bg-rose-50 border-rose-200 text-rose-900",
        icon: "text-rose-500",
    },
    success: {
        container: "bg-emerald-50 border-emerald-200 text-emerald-900",
        icon: "text-emerald-500",
    },
};

const icons = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
};

export function Callout({ title, children, variant = 'info', className, role }: CalloutProps) {
    const Icon = icons[variant];
    const styles = variants[variant];

    return (
        <div className={cn("rounded-lg border p-4 flex gap-3", styles.container, className)} role={role}>
            <div className="shrink-0 mt-0.5">
                <Icon className={cn("h-5 w-5", styles.icon)} />
            </div>
            <div className="flex-1">
                {title && <h5 className="font-semibold mb-1">{title}</h5>}
                <div className="text-sm opacity-90 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
}
