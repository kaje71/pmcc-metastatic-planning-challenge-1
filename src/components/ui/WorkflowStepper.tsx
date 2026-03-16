/**
 * WorkflowStepper  -  visual advance organiser for the introduction tab.
 * Shows the tab journey as a connected step flow.
 */

import { BookOpen, FileText, Stethoscope, Calculator } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface Step {
    number: number;
    label: string;
    description: string;
    icon: LucideIcon;
    color: string;      // tailwind bg class for the circle
    textColor: string;   // tailwind text class
}

const STEPS: Step[] = [
    { number: 1, label: 'Introduction', description: 'Purpose & objectives', icon: BookOpen, color: 'bg-purple-100', textColor: 'text-purple-600' },
    { number: 2, label: 'Clinical case', description: 'Patient context & intent', icon: Stethoscope, color: 'bg-emerald-100', textColor: 'text-emerald-600' },
    { number: 3, label: 'Calculator', description: 'Enter DVH → get score', icon: Calculator, color: 'bg-rose-100', textColor: 'text-rose-600' },
    { number: 4, label: 'Supplementary', description: 'Rationale & evidence', icon: FileText, color: 'bg-cyan-100', textColor: 'text-cyan-600' },
];

export function WorkflowStepper() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-5">
                Challenge workflow
            </h3>

            {/* Desktop: horizontal flow */}
            <div className="hidden md:flex items-start gap-0">
                {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.number} className="flex items-start flex-1 min-w-0">
                            {/* Step node */}
                            <div className="flex flex-col items-center text-center flex-1 min-w-0">
                                <div className={clsx(
                                    "w-12 h-12 rounded-full flex items-center justify-center mb-2 shrink-0 transition-transform hover:scale-110",
                                    step.color,
                                )}>
                                    <Icon className={clsx("w-5 h-5", step.textColor)} />
                                </div>
                                <div className={clsx("text-xs font-bold mb-0.5", step.textColor)}>
                                    {step.number}. {step.label}
                                </div>
                                <div className="text-[11px] text-slate-500 leading-tight px-1">
                                    {step.description}
                                </div>
                            </div>
                            {/* Connector line */}
                            {i < STEPS.length - 1 && (
                                <div className="flex items-center mt-6 -mx-1 shrink-0">
                                    <div className="w-6 h-0.5 bg-slate-200 rounded-full" />
                                    <div className="w-1.5 h-1.5 border-r-2 border-t-2 border-slate-300 rotate-45 -ml-1" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Mobile: vertical flow */}
            <div className="md:hidden space-y-3">
                {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.number} className="flex items-start gap-3">
                            {/* Number + connector line */}
                            <div className="flex flex-col items-center">
                                <div className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                    step.color,
                                )}>
                                    <Icon className={clsx("w-4 h-4", step.textColor)} />
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className="w-0.5 h-4 bg-slate-200 mt-1 rounded-full" />
                                )}
                            </div>
                            {/* Label */}
                            <div className="pt-2">
                                <div className={clsx("text-sm font-semibold", step.textColor)}>
                                    {step.number}. {step.label}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {step.description}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center">
                Read Tabs 1–2 once, then live in Tab 3 while you plan. Tab 4 offers additional clinical context that can be explored at your own pace.
            </p>
        </div>
    );
}
