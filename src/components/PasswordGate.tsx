import { useState, useEffect, useRef } from 'react';
import { Activity, Lock, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'pal-challenge-auth';
const PASSWORD = 'palliative2026';

export function usePasswordGate(): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [authenticated, setAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  return [authenticated, setAuthenticated];
}

function authenticate(): boolean {
  try {
    sessionStorage.setItem(STORAGE_KEY, 'true');
  } catch { /* noop */ }
  return true;
}

export function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      authenticate();
      onAuthenticated();
    } else {
      setError(true);
      setShake(true);
      setValue('');
      inputRef.current?.focus();
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col items-center justify-center px-4">
      {/* Header accent bar */}
      <div
        className="fixed top-0 left-0 right-0 h-1.5"
        style={{ background: 'var(--pmac-gradient-main)' }}
      />

      <div
        className={`w-full max-w-md transition-transform duration-300 ${shake ? 'animate-shake' : ''}`}
      >
        {/* Logo / branding */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="p-4 rounded-2xl mb-5 shadow-lg"
            style={{ background: 'var(--pmac-gradient-main)' }}
          >
            <Activity className="h-10 w-10 text-white" />
          </div>
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight text-center leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            PMCC Metastatic Planning Challenge
          </h1>
          <p
            className="text-base mt-2 opacity-70"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            #1 — Thorax
          </p>
        </div>

        {/* Gate card */}
        <div className="card-elevated p-8 border border-[var(--color-border-default)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-[var(--pmac-100)]">
              <Lock className="h-5 w-5" style={{ color: 'var(--pmac-600)' }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Restricted access
              </h2>
              <p className="text-sm opacity-60" style={{ color: 'var(--color-text-secondary)' }}>
                Enter the challenge password to continue
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="gate-password"
                className="block text-sm font-medium mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Password
              </label>
              <input
                ref={inputRef}
                id="gate-password"
                type="password"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Enter password"
                autoComplete="off"
                className="w-full"
                style={error ? { borderColor: 'var(--color-error)' } : undefined}
              />
              {error && (
                <div
                  className="flex items-center gap-1.5 mt-2 text-sm"
                  style={{ color: 'var(--color-error)' }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Incorrect password. Please try again.</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!value.trim()}
              className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-base shadow-md
                         transition-all duration-200 hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--pmac-gradient-main)' }}
            >
              Enter challenge
            </button>
          </form>
        </div>

        <p
          className="text-xs text-center mt-6 opacity-50"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          This site is for authorised PMCC participants only.
        </p>
      </div>
    </div>
  );
}
