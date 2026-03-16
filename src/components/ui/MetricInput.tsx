import React from 'react';
import { cn } from '../../utils/cn';

interface MetricInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    units?: string;
    error?: boolean;
}

export const MetricInput = React.forwardRef<HTMLInputElement, MetricInputProps>(
    ({ className, label, units, error, ...props }, ref) => {
        return (
            <div className="relative group w-full">
                {label && (
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative flex items-center">
                    <input
                        ref={ref}
                        className={cn(
                            "w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2.5",
                            "focus:outline-none focus:ring-4 focus:ring-pmac-accent/20 focus:border-pmac-accent",
                            "transition-all duration-200 placeholder:text-slate-400 font-mono tabular-nums text-right pr-9",
                            "disabled:bg-slate-50 disabled:text-slate-500",
                            error && "border-rose-500 focus:ring-rose-200 focus:border-rose-500",
                            className
                        )}
                        {...props}
                    />
                    {units && (
                        <span className="absolute right-3 text-slate-500 text-sm font-medium pointer-events-none">
                            {units}
                        </span>
                    )}
                </div>
            </div>
        );
    }
);

MetricInput.displayName = 'MetricInput';
