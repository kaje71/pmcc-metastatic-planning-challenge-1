/**
 * Scoring Matrix Types
 * 
 * TypeScript types for the official scoring matrix JSON schema.
 */

// Bin threshold conditions
export interface Bin {
    label: 'unacceptable' | 'marginal' | 'acceptable' | 'good' | 'ideal';
    // Inclusive bounds
    gte?: number;  // greater than or equal
    lte?: number;  // less than or equal
    // Exclusive bounds
    gt?: number;   // greater than
    lt?: number;   // less than
    // Optional note (e.g., "PASS", "FAIL")
    note?: string;
}

// Individual scoring metric
export interface ScoringMetric {
    id: number;
    weight: number;
    structure: string;
    // metric: string; // Removed as it is not in the JSON (use structure + statistic)
    statistic: string;
    unit: string;
    direction: 'higher_is_better' | 'lower_is_better';
    bins: Bin[];
    category?: string;
    hard_gate?: boolean;
    boolean_input?: boolean;
    reporting_only?: boolean;
    display_name?: string;
}

// Challenge prescription info
export interface Prescription {
    total_dose_Gy: number;
    fractions: number;
    dose_per_fraction_Gy: number;
}

// Challenge metadata
export interface ChallengeInfo {
    name: string;
    prescription: Prescription;
    targets: {
        included: string[];
        removed_from_original_2021_case?: string[];
        ptv_definition_note?: string;
    };
    scoring: {
        total_weight: number;
        bin_logic_notes: string[];
    };
}

// Full scoring matrix schema
export interface ScoringMatrix {
    schema_version: string;
    challenge: ChallengeInfo;
    metrics: ScoringMetric[];
}

// Score result for a single metric
export interface MetricScoreResult {
    id: number;
    structure: string;
    statistic: string;
    value: number | null;
    bin: Bin | null;
    binLabel: string;
    points: number;
    maxPoints: number;
    status: 'pass' | 'warning' | 'fail' | 'incomplete';
    hardGate?: boolean;
    isGateFail?: boolean;
}

// Overall score result
export interface ScoringResult {
    totalScore: number;
    maxScore: number;
    percentage: number;
    metricScores: MetricScoreResult[];
    planStatus: 'COMPLETE' | 'INCOMPLETE' | 'UNACCEPTABLE';
    hardGateFailed: boolean;
    hardGateFailures: MetricScoreResult[];
}

// Map bin labels to score multipliers (0-1)
export const BIN_SCORE_MULTIPLIERS: Record<Bin['label'], number> = {
    unacceptable: 0,
    marginal: 0.25,
    acceptable: 0.5,
    good: 0.75,
    ideal: 1.0,
};

// Map bin labels to display status
export const BIN_STATUS_MAP: Record<Bin['label'], MetricScoreResult['status']> = {
    unacceptable: 'fail',
    marginal: 'warning',
    acceptable: 'warning',
    good: 'pass',
    ideal: 'pass',
};
