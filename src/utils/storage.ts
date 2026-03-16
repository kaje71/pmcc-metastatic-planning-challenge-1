/**
 * Version Migration Handler
 * 
 * P1 Fix: Handle schema changes in rubric versions gracefully.
 * Transforms old attempt data when loading from localStorage.
 */

import type { SavedAttempt } from '../types';
import { getRubricVersion } from '../data/config';

const STORAGE_KEY = 'pal_lung_attempts';
const STORAGE_SCHEMA_VERSION = 1;

interface StorageWrapper {
    schemaVersion: number;
    attempts: SavedAttempt[];
}

/**
 * Migrates old storage format to current schema.
 */
function migrateAttempts(data: unknown): SavedAttempt[] {
    // If data is already an array (old format), wrap it
    if (Array.isArray(data)) {
        console.log('[Migration] Migrating from legacy array format');
        return normalizeAttempts(data as SavedAttempt[]);
    }

    // If data is wrapped with schema version
    if (typeof data === 'object' && data !== null && 'schemaVersion' in data) {
        const wrapped = data as StorageWrapper;

        // Handle future migrations here
        // if (wrapped.schemaVersion < 2) { ... }

        return normalizeAttempts(wrapped.attempts);
    }

    return [];
}

function normalizeAttempts(attempts: SavedAttempt[]): SavedAttempt[] {
    return attempts.map((attempt, index) => {
        const baseResult = attempt.result ?? ({
            totalScore: 0,
            maxScore: 150,
            percentage: 0,
            metricScores: [],
            planStatus: 'INCOMPLETE',
            hardGateFailed: false,
            hardGateFailures: [],
        } as SavedAttempt['result']);

        const maxScore = Number.isFinite((attempt.result as any)?.maxScore)
            ? (attempt.result as any).maxScore
            : Number.isFinite((attempt.result as any)?.maxPossibleScore)
                ? (attempt.result as any).maxPossibleScore
                : 150;

        const totalScore = Number.isFinite((baseResult as any).totalScore)
            ? (baseResult as any).totalScore
            : 0;

        const percentage = Number.isFinite((baseResult as any)?.percentage)
            ? (baseResult as any).percentage
            : maxScore > 0
                ? (totalScore / maxScore) * 100
                : 0;

        return {
            id: attempt.id || `legacy-${index}-${Date.now()}`,
            timestamp: attempt.timestamp || new Date().toISOString(),
            rubricVersion: attempt.rubricVersion || getRubricVersion(),
            inputs: attempt.inputs || {},
            result: {
                ...baseResult,
                totalScore,
                maxScore,
                percentage,
                planStatus: baseResult.planStatus || 'INCOMPLETE',
                metricScores: baseResult.metricScores || [],
                hardGateFailed: (baseResult as any).hardGateFailed ?? false,
                hardGateFailures: (baseResult as any).hardGateFailures ?? [],
            },
            notes: attempt.notes,
        };
    });
}

/**
 * Load attempts from localStorage with migration support.
 */
export function loadAttempts(): SavedAttempt[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];

        const data = JSON.parse(stored);
        return migrateAttempts(data);
    } catch (e) {
        console.error('[Migration] Failed to load attempts:', e);
        return [];
    }
}

/**
 * Save attempts to localStorage with schema version.
 */
export function saveAttempts(attempts: SavedAttempt[]): void {
    try {
        const wrapper: StorageWrapper = {
            schemaVersion: STORAGE_SCHEMA_VERSION,
            attempts,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wrapper));
    } catch (e) {
        console.error('[Migration] Failed to save attempts:', e);
    }
}

/**
 * Clear all stored attempts.
 */
export function clearAttempts(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        console.error('[Migration] Failed to clear attempts:', e);
    }
}

/**
 * Get storage statistics.
 */
export function getStorageStats(): { count: number; sizeKB: number } {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { count: 0, sizeKB: 0 };

        const data = JSON.parse(stored);
        const attempts = migrateAttempts(data);

        return {
            count: attempts.length,
            sizeKB: Math.round(stored.length / 1024 * 10) / 10,
        };
    } catch {
        return { count: 0, sizeKB: 0 };
    }
}

/**
 * Validate that all attempts have compatible rubric versions.
 * Returns attempts that may need attention.
 */
export function checkVersionCompatibility(): { current: string; incompatible: number } {
    const currentVersion = getRubricVersion();
    const attempts = loadAttempts();

    const incompatible = attempts.filter(a => a.rubricVersion !== currentVersion).length;

    return {
        current: currentVersion,
        incompatible,
    };
}
