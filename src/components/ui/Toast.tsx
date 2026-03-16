/**
 * Toast Component
 * 
 * Provides feedback notifications for user actions.
 * P0 Fix: Add save confirmation feedback
 */

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ToastContext, type ToastMessage, type ToastType } from './useToast';

const icons: Record<ToastType, typeof CheckCircle> = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const styles: Record<ToastType, string> = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800',
};

const iconStyles: Record<ToastType, string> = {
    success: 'text-emerald-500',
    error: 'text-rose-500',
    warning: 'text-amber-500',
    info: 'text-sky-500',
};

function ToastItem({ toast, onClose }: { toast: ToastMessage; onClose: () => void }) {
    const Icon = icons[toast.type];

    useEffect(() => {
        const duration = toast.duration || 4000;
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [toast.duration, onClose]);

    return (
        <div
            role="alert"
            aria-live="polite"
            className={clsx(
                "flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full duration-300",
                styles[toast.type]
            )}
        >
            <Icon className={clsx("w-5 h-5 flex-shrink-0 mt-0.5", iconStyles[toast.type])} />
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{toast.title}</p>
                {toast.message && (
                    <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                )}
            </div>
            <button
                onClick={onClose}
                className="p-1 rounded hover:bg-black/5 transition-colors flex-shrink-0"
                aria-label="Dismiss notification"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setToasts(prev => [...prev, { ...toast, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div
                aria-label="Notifications"
                className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
            >
                {toasts.map(toast => (
                    <div key={toast.id} className="pointer-events-auto">
                        <ToastItem
                            toast={toast}
                            onClose={() => removeToast(toast.id)}
                        />
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
