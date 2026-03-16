/**
 * Unit tests for storage utilities.
 * Tests localStorage operations with mock storage.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock localStorage (vitest doesn't have real localStorage in Node)
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: vi.fn((i: number) => Object.keys(store)[i] || null),
    };
})();

// Replace global localStorage
vi.stubGlobal('localStorage', localStorageMock);

// Now import the storage module (after localStorage is mocked)
import { loadAttempts, saveAttempts, clearAttempts, getStorageStats } from './storage';
import type { SavedAttempt } from '../types';
import type { ScoringResult } from '../types/scoringTypes';

// Helper to create a test attempt
function createTestAttempt(overrides: Partial<SavedAttempt> = {}): SavedAttempt {
    const defaultInputs: Record<string, number | null> = {
        1: 98.5,
        7: 25.0,
        8: 30.0,
        10: 20.0,
        13: 28.0,
        14: 15.0,
        15: 5.0,
    };

    const defaultResult: ScoringResult = {
        totalScore: 85.5,
        maxScore: 150,
        percentage: 57,
        planStatus: 'COMPLETE',
        metricScores: [],
        hardGateFailed: false,
        hardGateFailures: [],
    };

    return {
        id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        rubricVersion: '0.2-evidence-aligned',
        inputs: defaultInputs,
        result: defaultResult,
        notes: 'Test attempt',
        ...overrides,
    };
}

describe('Storage Utilities', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    describe('loadAttempts', () => {
        it('returns empty array when no data stored', () => {
            const attempts = loadAttempts();
            expect(attempts).toEqual([]);
        });

        it('loads wrapped format (schemaVersion)', () => {
            const attempt = createTestAttempt();
            localStorageMock.setItem('pal_lung_attempts', JSON.stringify({
                schemaVersion: 1,
                attempts: [attempt],
            }));

            const loaded = loadAttempts();
            expect(loaded).toHaveLength(1);
            expect(loaded[0].id).toBe(attempt.id);
        });

        it('migrates legacy array format', () => {
            const attempt = createTestAttempt();
            // Old format: just an array, no wrapper
            localStorageMock.setItem('pal_lung_attempts', JSON.stringify([attempt]));

            const loaded = loadAttempts();
            expect(loaded).toHaveLength(1);
            expect(loaded[0].id).toBe(attempt.id);
        });

        it('returns empty array on corrupted data', () => {
            localStorageMock.setItem('pal_lung_attempts', 'not-valid-json{{{');

            const loaded = loadAttempts();
            expect(loaded).toEqual([]);
        });
    });

    describe('saveAttempts', () => {
        it('saves attempts with schema version wrapper', () => {
            const attempts = [createTestAttempt(), createTestAttempt()];
            saveAttempts(attempts);

            const stored = JSON.parse(localStorageMock.getItem('pal_lung_attempts') || '{}');
            expect(stored.schemaVersion).toBe(1);
            expect(stored.attempts).toHaveLength(2);
        });

        it('overwrites previous data', () => {
            saveAttempts([createTestAttempt()]);
            saveAttempts([createTestAttempt(), createTestAttempt()]);

            const stored = JSON.parse(localStorageMock.getItem('pal_lung_attempts') || '{}');
            expect(stored.attempts).toHaveLength(2);
        });
    });

    describe('clearAttempts', () => {
        it('removes data from localStorage', () => {
            saveAttempts([createTestAttempt()]);
            expect(localStorageMock.getItem('pal_lung_attempts')).not.toBeNull();

            clearAttempts();
            expect(localStorageMock.getItem('pal_lung_attempts')).toBeNull();
        });
    });

    describe('getStorageStats', () => {
        it('returns zero stats when empty', () => {
            const stats = getStorageStats();
            expect(stats.count).toBe(0);
            expect(stats.sizeKB).toBe(0);
        });

        it('returns correct count and approximate size', () => {
            const attempts = [createTestAttempt(), createTestAttempt(), createTestAttempt()];
            saveAttempts(attempts);

            const stats = getStorageStats();
            expect(stats.count).toBe(3);
            expect(stats.sizeKB).toBeGreaterThan(0);
        });
    });
});

describe('Storage Schema Migration', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    it('handles empty object gracefully', () => {
        localStorageMock.setItem('pal_lung_attempts', JSON.stringify({}));
        const loaded = loadAttempts();
        expect(loaded).toEqual([]);
    });

    it('handles null stored value', () => {
        // getItem returns null for missing keys
        const loaded = loadAttempts();
        expect(loaded).toEqual([]);
    });

    it('preserves all attempt fields through save/load cycle', () => {
        const attempt = createTestAttempt({
            notes: 'Important notes with special chars: <>&"',
        });

        saveAttempts([attempt]);
        const loaded = loadAttempts();

        expect(loaded[0].id).toBe(attempt.id);
        expect(loaded[0].timestamp).toBe(attempt.timestamp);
        expect(loaded[0].rubricVersion).toBe(attempt.rubricVersion);
        expect(loaded[0].notes).toBe(attempt.notes);
        expect(loaded[0].result.totalScore).toBe(attempt.result.totalScore);
        expect(loaded[0].inputs['1']).toBe(attempt.inputs['1']);
    });
});
