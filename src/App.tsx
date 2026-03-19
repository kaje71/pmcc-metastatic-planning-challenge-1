import { useState, useMemo, useEffect } from 'react';
import { PasswordGate, usePasswordGate } from './components/PasswordGate';
import { ClinicalCase } from './components/views/ClinicalCase';
import { Supplementary } from './components/views/Supplementary';
import {
  Calculator,
  BookOpen,
  Trophy,
  Stethoscope,
  Library
} from 'lucide-react';


import { Header } from './components/layout/Header';
import { ScoreCalculator } from './components/ScoreCalculator';
import { Overview } from './components/views/Overview';

import { History } from './components/views/History';
import { Leaderboard } from './components/views/Leaderboard';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Logic & Types
import { getRubricVersion } from './data/config';
import { loadAttempts } from './utils/storage';
import { ENABLE_COMMUNITY_LEADERBOARD } from './config/featureFlags';
import type { SavedAttempt, TabId } from './types';
import './index.css';



export default function App() {
  const [authenticated, setAuthenticated] = usePasswordGate();
  const [activeTab, setActiveTab] = useState<TabId>('introduction');
  // Load attempts for history/leaderboard (readonly for now as saving is handled internally by calculator)
  const [attempts] = useState<SavedAttempt[]>(() => {
    return loadAttempts();
  });

  const rubricVersion = getRubricVersion();



  // Full tab label map (includes secondary pages)
  const tabLabels: Record<TabId, string> = {
    introduction: '1. Introduction',
    clinical_case: '2. Clinical Case',
    calculator: '3. Calculator',
    supplementary: '4. Supplementary',
    history: 'My attempts',
    leaderboard: 'Leaderboard',
  };

  // Navigation items - conditionally include leaderboard based on feature flag
  const navItems = useMemo(() => {
    const items: { id: TabId; label: string; icon: typeof BookOpen }[] = [
      { id: 'introduction', label: '1. Introduction', icon: BookOpen },
      { id: 'clinical_case', label: '2. Clinical Case', icon: Stethoscope },
      { id: 'calculator', label: '3. Calculator', icon: Calculator },
      { id: 'supplementary', label: '4. Supplementary', icon: Library },
    ];

    if (ENABLE_COMMUNITY_LEADERBOARD) {
      items.push({ id: 'leaderboard', label: 'Leaderboard', icon: Trophy });
    }

    return items;
  }, []);

  // P1: Update document title based on active tab
  useEffect(() => {
    const tabLabel = tabLabels[activeTab] || 'Scoring calculator';
    document.title = `${tabLabel} – PMCC Metastatic Planning Challenge #1 - Thorax`;
  }, [activeTab, tabLabels]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<TabId>).detail;
      if (!detail) return;
      if (navItems.some((item) => item.id === detail)) {
        setActiveTab(detail);
      }
    };
    window.addEventListener('pal:navigate', handler as EventListener);
    return () => window.removeEventListener('pal:navigate', handler as EventListener);
  }, [navItems]);

  if (!authenticated) {
    return <PasswordGate onAuthenticated={() => setAuthenticated(true)} />;
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-primary text-content-primary font-sans">
        {/* Skip to main content link for accessibility */}
        <a
          href={activeTab === 'calculator' ? '#calculator-inputs' : '#main-content'}
          className="skip-link"
        >
          {activeTab === 'calculator' ? 'Skip to calculator inputs' : 'Skip to main content'}
        </a>

        {/* Top Header Bar */}
        <Header
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rubricVersion={rubricVersion}
          navItems={navItems}
        />

        {/* Main Content */}
        <main id="main-content" className="max-w-7xl mx-auto px-4 py-8">

          {/* Tab Panels */}
          <div className="min-h-[60vh]" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
            <ErrorBoundary key={activeTab}>
              {activeTab === 'introduction' && <Overview />}
              {activeTab === 'clinical_case' && <ClinicalCase />}

              {activeTab === 'calculator' && <ScoreCalculator />}
              {activeTab === 'supplementary' && <Supplementary />}
              {activeTab === 'history' && <History attempts={attempts} />}
              {activeTab === 'leaderboard' && ENABLE_COMMUNITY_LEADERBOARD && (
                <Leaderboard attempts={attempts} />
              )}
            </ErrorBoundary>
          </div>
        </main>


      </div>
    </ToastProvider>
  );
}
