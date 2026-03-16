/**
 * Type definitions for the Pal Lung Planning Challenge Calculator.
 * These types map to the structure defined in docs/architectural_map.json
 */

import type { ScoringResult } from './scoringTypes';

// --- Scoring Engine Types ---

export interface MetricInput {
    ptv_v100_percent: number;
    cord_dmax_gy: number;
    cord_prv_dmax_gy: number;
    oesophagus_dmean_gy: number;
    lung_minus_gtv_dmean_gy: number;
    lung_minus_gtv_v16_percent: number;
    lung_minus_gtv_v4_5_percent: number;
    heart_v19_5_percent: number | null;
    heart_v19_5_not_achievable: boolean;
    heart_v39_percent: number;
    heart_dmean_gy: number | null; // Reporting only
}

export interface MetricScore {
    id: string;
    name: string;
    value: number | null;
    points: number;
    maxPoints: number;
    status: 'pass' | 'fail' | 'warning' | 'skipped' | 'incomplete';
    message?: string;
}

export interface ScoreResult {
    totalScore: number;
    maxPossibleScore: number;
    planStatus: 'PASS' | 'FAIL' | 'INCOMPLETE';
    failReasons: string[];
    metricScores: MetricScore[];
    rubricVersion: string;
}

// --- Scoring Configuration Types (from architectural_map.json) ---

export interface Breakpoint {
    value: number;
    points: number;
    label: string;
}

export interface ScoringModel {
    type: 'piecewise_linear' | 'reporting_only' | 'needs_human_adjudication';
    direction: 'higher_is_better' | 'lower_is_better';
    breakpoints: Breakpoint[];
    notes?: string;
}

export interface CriterionInput {
    field: string;
    type: 'number' | 'boolean' | 'string';
    units?: string;
    required: boolean;
    allowed_range?: { min: number; max: number };
    display_precision?: number;
    optional_toggle_field?: string;
}

export interface Criterion {
    id: string;
    name: string;
    description: string;
    weight: number;
    input: CriterionInput;
    scoring_model: ScoringModel;
    calculation_rule: string;
    error_handling: string;
    is_scored: boolean;
    display_order: number;
}

export interface CriticalFailPolicy {
    mode: 'flag_only' | 'zero_total_score';
    critical_metrics: string[];
    rule: string;
}

export interface ScoringMatrix {
    version: string;
    scale: {
        max_points: number;
        min_points: number;
        aggregation: string;
        weight_sum_required: boolean;
    };
    benchmarking: {
        organiser_plan_score_field: string;
        benchmark_name: string;
        benchmark_formula: string;
        notes: string;
    };
    critical_fail_policy: CriticalFailPolicy;
    criteria: Criterion[];
    aggregation_details: {
        normalisation: string;
        active_metric_definition: string;
        formula: string;
        notes: string;
    };
    cross_field_validations: CrossFieldValidation[];
}

export interface CrossFieldValidation {
    id: string;
    fields: string[];
    rule: string;
    severity: 'warning' | 'error' | 'info';
    message: string;
}

// --- Attempt Storage Types ---

export interface SavedAttempt {
    id: string;
    timestamp: string;
    rubricVersion: string;
    inputs: Record<string, number | null>;
    result: ScoringResult;
    notes?: string;
}

// --- UI State Types ---

export type TabId = 'introduction' | 'clinical_case' | 'calculator' | 'supplementary' | 'history' | 'leaderboard';

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
}

export type { OverviewContent } from './overview';
