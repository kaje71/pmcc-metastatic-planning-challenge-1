/**
 * ErrorBoundary — Catches render errors and shows a fallback UI.
 * Wraps tab panels to prevent white-screen crashes.
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        if (import.meta.env.DEV) {
            console.error('ErrorBoundary caught:', error, errorInfo);
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="p-8 text-center" role="alert">
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 max-w-lg mx-auto">
                        <h2 className="text-lg font-bold text-rose-900 mb-2">Something went wrong</h2>
                        <p className="text-sm text-rose-700 mb-4">
                            An unexpected error occurred while rendering this section.
                        </p>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700 transition-colors"
                        >
                            Try again
                        </button>
                        {import.meta.env.DEV && this.state.error && (
                            <pre className="mt-4 text-xs text-left bg-rose-100 p-3 rounded overflow-auto max-h-40">
                                {this.state.error.message}
                            </pre>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
