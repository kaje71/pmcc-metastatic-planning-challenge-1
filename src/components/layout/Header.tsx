import { useState, useEffect, useRef } from 'react';
import { Activity, Menu, X, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import type { TabId } from '../../types';

interface NavItem {
    id: TabId;
    label: string;
    icon: LucideIcon;
}

interface HeaderProps {
    activeTab: TabId;
    onTabChange: (id: TabId) => void;
    rubricVersion?: string; // Optional, kept for API compatibility but not rendered in header
    navItems: NavItem[];
}

export function Header({ activeTab, onTabChange, navItems }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const hamburgerRef = useRef<HTMLButtonElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Focus trap: focus first menu item on open, restore on close
    useEffect(() => {
        if (mobileMenuOpen && mobileMenuRef.current) {
            const firstButton = mobileMenuRef.current.querySelector('button');
            firstButton?.focus();
        } else if (!mobileMenuOpen) {
            hamburgerRef.current?.focus();
        }
    }, [mobileMenuOpen]);

    return (
        <header className="relative bg-[image:var(--pmac-gradient-main)] text-white shadow-lg overflow-hidden">
            {/* Background Texture/Accents could go here */}

            <div className="relative max-w-7xl mx-auto px-4 z-10 py-6">
                <div className="flex flex-col items-center gap-6">
                    {/* Logo / Title row */}
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
                            <Activity className="h-8 w-8 lg:h-10 lg:w-10 text-white" />
                        </div>
                        <h1
                            className="text-xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight drop-shadow-md whitespace-nowrap"
                            style={{ color: '#FFFFFF' }}
                        >
                            PMCC Metastatic Planning Challenge #1 - Thorax
                        </h1>
                    </div>

                    {/* Desktop Navigation Row */}
                    <nav className="hidden md:flex items-center justify-center gap-2 lg:gap-4 flex-wrap" role="tablist">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    id={`tab-${item.id}`}
                                    role="tab"
                                    aria-selected={isActive}
                                    tabIndex={isActive ? 0 : -1}
                                    onClick={() => onTabChange(item.id)}
                                    onKeyDown={(e) => {
                                        // Arrow key navigation between tabs
                                        const idx = navItems.findIndex(n => n.id === item.id);
                                        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            const nextIdx = (idx + 1) % navItems.length;
                                            onTabChange(navItems[nextIdx].id);
                                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            const prevIdx = (idx - 1 + navItems.length) % navItems.length;
                                            onTabChange(navItems[prevIdx].id);
                                        } else if (e.key === 'Home') {
                                            e.preventDefault();
                                            onTabChange(navItems[0].id);
                                        } else if (e.key === 'End') {
                                            e.preventDefault();
                                            onTabChange(navItems[navItems.length - 1].id);
                                        }
                                    }}
                                    className={clsx(
                                        "group flex flex-col items-center justify-center px-6 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-pmac-800",
                                        isActive
                                            ? "bg-white/20 text-white shadow-md ring-1 ring-white/20 backdrop-blur-md"
                                            : "text-white/70 hover:bg-white/10 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-2.5 relative z-10">
                                        <Icon className={clsx("h-5 w-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                                        <span className="text-base font-bold tracking-wide">{item.label}</span>
                                    </div>
                                    {isActive && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Mobile Menu Button - hidden at 900px+ */}
                    <button
                        ref={hamburgerRef}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-3 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
                    </button>
                </div>
            </div>

            {/* Decorative Curve (The "Swoosh") */}
            <div className="absolute bottom-0 left-0 right-0 h-8 lg:h-12 overflow-hidden pointer-events-none translate-y-px">
                <svg
                    viewBox="0 0 1440 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full preserve-3d"
                    preserveAspectRatio="none"
                >
                    {/* Layered waves for depth */}
                    <path
                        d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75H1440V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
                        fill="var(--color-bg-primary)"
                        opacity="0.3"
                        transform="scale(1, 0.8) translate(0, 20)"
                    />
                    <path
                        d="M0 60L48 68.3C96 76.7 192 93.3 288 91.7C384 90 480 70 576 56.7C672 43.3 768 36.7 864 41.7C960 46.7 1056 63.3 1152 70C1248 76.7 1344 73.3 1392 71.7L1440 70V121H1392C1344 121 1248 121 1152 121C1056 121 960 121 864 121C768 121 672 121 576 121C480 121 384 121 288 121C192 121 96 121 48 121H0V60Z"
                        fill="var(--color-bg-primary)"
                    />
                </svg>
            </div>

            {/* Mobile Menu Dropdown & status for smaller screens */}
            {mobileMenuOpen && (
                <div ref={mobileMenuRef} className="md:hidden absolute top-[80px] left-0 right-0 bg-pmac-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 shadow-2xl z-50 animate-in slide-in-from-top-2"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            setMobileMenuOpen(false);
                        }
                    }}
                >
                    <div className="grid gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onTabChange(item.id);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={clsx(
                                        "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left text-base font-medium transition-all",
                                        activeTab === item.id
                                            ? "bg-white/10 text-white border border-white/10"
                                            : "text-white/70 hover:bg-white/5 active:bg-white/10"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </header>
    );
}
