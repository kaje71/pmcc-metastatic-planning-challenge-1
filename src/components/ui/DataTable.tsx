import React from 'react';
import { cn } from '../../utils/cn';

interface DataTableProps {
    /** Column headers */
    headers: string[];
    /** Table rows - each row is an array of cells */
    rows: Array<Array<string | React.ReactNode>>;
    /** Compact mode (smaller padding) */
    compact?: boolean;
    /** Optional caption for accessibility */
    caption?: string;
    className?: string;
}

/**
 * DataTable - Standardized table component
 * 
 * Provides consistent table styling with light header background,
 * hover states, and proper spacing.
 */
export function DataTable({
    headers,
    rows,
    compact = false,
    caption,
    className,
}: DataTableProps) {
    const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3';

    return (
        <div className={cn('overflow-hidden rounded-lg border border-slate-200', className)}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    {caption && <caption className="sr-only">{caption}</caption>}
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <tr>
                            {headers.map((header, idx) => (
                                <th
                                    key={idx}
                                    scope="col"
                                    className={cn(
                                        cellPadding,
                                        'font-semibold text-xs uppercase tracking-wide whitespace-nowrap'
                                    )}
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((row, rowIdx) => (
                            <tr
                                key={rowIdx}
                                className="bg-white hover:bg-slate-50/50 transition-colors"
                            >
                                {row.map((cell, cellIdx) => (
                                    <td
                                        key={cellIdx}
                                        className={cn(
                                            cellPadding,
                                            cellIdx === 0
                                                ? 'font-medium text-slate-900'
                                                : 'text-slate-600'
                                        )}
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
