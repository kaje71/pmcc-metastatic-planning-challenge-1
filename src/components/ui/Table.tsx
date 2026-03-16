import React from 'react';
import { cn } from '../../utils/cn';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
    caption?: string;
}

export function Table({ className, caption, ...props }: TableProps) {
    return (
        <div className="relative w-full overflow-auto">
            <table
                className={cn("w-full caption-bottom text-sm", className)}
                {...props}
            >
                {caption && (
                    <caption className="sr-only">{caption}</caption>
                )}
                {props.children}
            </table>
        </div>
    );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={cn("[&_tr]:border-b bg-slate-50", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr
            className={cn(
                "border-b border-slate-200 transition-colors hover:bg-[var(--pmac-50)]/80 data-[state=selected]:bg-[var(--pmac-50)]",
                className
            )}
            {...props}
        />
    );
}

export function TableHead({ className, scope = "col", ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            scope={scope}
            className={cn(
                "h-10 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0",
                className
            )}
            {...props}
        />
    );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return (
        <td
            className={cn(
                "p-4 align-middle [&:has([role=checkbox])]:pr-0 text-slate-700",
                className
            )}
            {...props}
        />
    );
}
