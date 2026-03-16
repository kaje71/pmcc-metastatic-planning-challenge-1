/**
 * Scoring Engine
 * 
 * Evaluates DVH metrics against the official scoring matrix.
 * Uses bin-based thresholds for score calculation.
 */

import calculatorMatrixData from '../../text/5_calculator.json' with { type: 'json' };
import type {
    ScoringMatrix,
    ScoringMetric,
    Bin,
    MetricScoreResult,
    ScoringResult
} from '../types/scoringTypes';
import { BIN_STATUS_MAP } from '../types/scoringTypes';

// Cache for loaded scoring matrix
let cachedMatrix: ScoringMatrix | null = null;

/**
 * Load the scoring matrix from the local text pack (with fetch fallback)
 */
export async function loadScoringMatrix(): Promise<ScoringMatrix> {
    if (cachedMatrix) return cachedMatrix;

    try {
        const response = await fetch('/text/5_calculator.json', { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            cachedMatrix = data;
            return cachedMatrix!;
        }
    } catch (err) {
        if (import.meta.env.DEV) {
            console.warn('Falling back to bundled 5_calculator.json:', err);
        }
    }

    cachedMatrix = calculatorMatrixData as ScoringMatrix;
    return cachedMatrix!;
}

/**
 * Get cached scoring matrix (synchronous, returns null if not loaded)
 */
export function getCachedMatrix(): ScoringMatrix | null {
    return cachedMatrix;
}

/**
 * Determine which bin a value falls into for a metric
 */
export function evaluateBin(value: number, metric: ScoringMetric): Bin | null {
    for (const bin of metric.bins) {
        let matches = true;

        // Check greater than or equal (gte)
        if (bin.gte !== undefined && value < bin.gte) {
            matches = false;
        }

        // Check less than or equal (lte)
        if (bin.lte !== undefined && value > bin.lte) {
            matches = false;
        }

        // Check greater than (gt)
        if (bin.gt !== undefined && value <= bin.gt) {
            matches = false;
        }

        // Check less than (lt)
        if (bin.lt !== undefined && value >= bin.lt) {
            matches = false;
        }

        if (matches) {
            return bin;
        }
    }

    return null;
}

/**
 * Calculate score for a single metric
 */
export function scoreMetric(
    value: number | null,
    metric: ScoringMetric
): MetricScoreResult {
    const maxPoints = metric.weight;

    // Reporting-only metrics: record value but don't score
    if (metric.reporting_only) {
        return {
            id: metric.id,
            structure: metric.structure,
            statistic: metric.statistic,
            value,
            bin: null,
            binLabel: value !== null && !isNaN(value) ? 'reporting' : 'incomplete',
            points: 0,
            maxPoints: 0,
            status: value !== null && !isNaN(value) ? 'pass' : 'incomplete',
            hardGate: false,
            isGateFail: false,
        };
    }

    if (value === null || isNaN(value)) {
        return {
            id: metric.id,
            structure: metric.structure,
            statistic: metric.statistic,
            value: null,
            bin: null,
            binLabel: 'incomplete',
            points: 0,
            maxPoints,
            status: 'incomplete',
            hardGate: metric.hard_gate ?? false,
            isGateFail: false,
        };
    }

    const bin = evaluateBin(value, metric);

    if (!bin) {
        // Value doesn't match any bin - treat as unacceptable
        return {
            id: metric.id,
            structure: metric.structure,
            statistic: metric.statistic,
            value,
            bin: null,
            binLabel: 'unacceptable',
            points: 0,
            maxPoints,
            status: 'fail',
            hardGate: metric.hard_gate ?? false,
            isGateFail: Boolean(metric.hard_gate),
        };
    }

    const binIndex = metric.bins.indexOf(bin);
    const maxIndex = Math.max(0, metric.bins.length - 1);
    const multiplier = maxIndex > 0 ? binIndex / maxIndex : 1;
    const points = maxPoints * multiplier;
    let status = BIN_STATUS_MAP[bin.label] ?? 'fail';

    if (binIndex === maxIndex && bin.label === 'acceptable' && metric.bins.length <= 2) {
        status = 'pass';
    }

    return {
        id: metric.id,
        structure: metric.structure,
        statistic: metric.statistic,
        value,
        bin,
        binLabel: bin.label,
        points,
        maxPoints,
        status,
        hardGate: metric.hard_gate ?? false,
        isGateFail: Boolean(metric.hard_gate) && bin.label === 'unacceptable',
    };
}

/**
 * Calculate total score for all metrics
 */
export function calculateScore(
    inputs: Record<number, number | null>,
    matrix: ScoringMatrix
): ScoringResult {
    const metricScores: MetricScoreResult[] = [];
    let totalScore = 0;
    let maxScore = 0;
    let hasUnacceptable = false;
    let hasIncomplete = false;
    let hardGateFailed = false;
    const hardGateFailures: MetricScoreResult[] = [];

    for (const metric of matrix.metrics) {
        const value = inputs[metric.id] ?? null;
        const result = scoreMetric(value, metric);

        metricScores.push(result);

        // Reporting-only metrics don't affect totals or completeness
        if (metric.reporting_only) continue;

        totalScore += result.points;
        maxScore += result.maxPoints;

        if (result.binLabel === 'unacceptable') {
            hasUnacceptable = true;
        }
        if (result.status === 'incomplete') {
            hasIncomplete = true;
        }
        if (result.isGateFail) {
            hardGateFailed = true;
            hardGateFailures.push(result);
        }
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    let planStatus: ScoringResult['planStatus'] = 'COMPLETE';
    if (hasIncomplete) {
        planStatus = 'INCOMPLETE';
    } else if (hasUnacceptable) {
        planStatus = 'UNACCEPTABLE';
    }

    return {
        totalScore,
        maxScore,
        percentage,
        metricScores,
        planStatus,
        hardGateFailed,
        hardGateFailures,
    };
}

/**
 * Group metrics by structure for UI display
 */
export function groupMetricsByStructure(
    metrics: ScoringMetric[]
): Map<string, ScoringMetric[]> {
    const groups = new Map<string, ScoringMetric[]>();

    for (const metric of metrics) {
        const existing = groups.get(metric.structure) || [];
        existing.push(metric);
        groups.set(metric.structure, existing);
    }

    return groups;
}

/**
 * Get threshold display string for a metric
 */
export function getThresholdDisplay(metric: ScoringMetric): string {
    const { bins, direction, unit } = metric;

    // Find acceptable threshold
    const acceptableBin = bins.find(b => b.label === 'acceptable');
    const idealBin = bins.find(b => b.label === 'ideal');

    if (direction === 'higher_is_better') {
        // For higher is better, show the minimum acceptable threshold
        if (acceptableBin?.gte !== undefined) {
            return `≥ ${acceptableBin.gte}${unit === '%' ? '%' : ' ' + unit}`;
        }
        if (idealBin?.gte !== undefined) {
            return `≥ ${idealBin.gte}${unit === '%' ? '%' : ' ' + unit}`;
        }
    } else {
        // For lower is better, show the maximum acceptable threshold
        if (acceptableBin?.lte !== undefined) {
            return `≤ ${acceptableBin.lte}${unit === '%' ? '%' : ' ' + unit}`;
        }
        if (idealBin?.lte !== undefined) {
            return `≤ ${idealBin.lte}${unit === '%' ? '%' : ' ' + unit}`;
        }
    }

    return '';
}

/**
 * Get ideal threshold for display
 */
export function getIdealThreshold(metric: ScoringMetric): string {
    const { bins, direction, unit } = metric;
    const idealBin = bins.find(b => b.label === 'ideal');

    if (!idealBin) return '';

    if (direction === 'higher_is_better' && idealBin.gte !== undefined) {
        return `${idealBin.gte}${unit === '%' ? '%' : ' ' + unit}`;
    }
    if (direction === 'lower_is_better' && idealBin.lte !== undefined) {
        return `${idealBin.lte}${unit === '%' ? '%' : ' ' + unit}`;
    }

    return '';
}

/**
 * Validation warning for a single input value
 */
export interface InputValidationWarning {
    metricId: number;
    message: string;
    severity: 'warning' | 'error';
}

/**
 * Plausible range bounds per unit type
 */
const PLAUSIBLE_RANGES: Record<string, { min: number; max: number }> = {
    '%': { min: 0, max: 120 },
    'Gy': { min: 0, max: 100 },
    '': { min: 0, max: 2.0 }, // unitless (CN)
};

/**
 * Validate a single metric input against physically plausible bounds.
 * Returns a warning if the value is outside the expected range.
 */
export function validateInput(
    value: number,
    metric: ScoringMetric
): InputValidationWarning | null {
    const unit = metric.unit ?? '';
    const range = PLAUSIBLE_RANGES[unit] ?? { min: -Infinity, max: Infinity };

    if (value < range.min) {
        return {
            metricId: metric.id,
            message: `Value ${value} is below the minimum plausible value (${range.min} ${unit}).`,
            severity: 'error',
        };
    }

    if (value > range.max) {
        return {
            metricId: metric.id,
            message: `Value ${value} exceeds the maximum plausible value (${range.max} ${unit}). Check your DVH extraction.`,
            severity: 'warning',
        };
    }

    return null;
}

/**
 * Cross-field validation result
 */
export interface CrossFieldWarning {
    message: string;
    metricIds: number[];
}

/**
 * Validate cross-field relationships between metrics.
 * Currently checks: Spinal Canal PRV D0.03cc ≥ Spinal Canal D0.03cc
 */
export function crossFieldValidate(
    inputs: Record<number, number | null>,
    matrix: ScoringMatrix
): CrossFieldWarning[] {
    const warnings: CrossFieldWarning[] = [];

    // Find cord and cord PRV metrics
    const cordMetric = matrix.metrics.find(
        m => m.structure === 'SpinalCanal' && m.statistic === 'D0.03cc'
    );
    const cordPrvMetric = matrix.metrics.find(
        m => m.structure === 'SpinalCanal_PRV' && m.statistic === 'D0.03cc'
    );

    if (cordMetric && cordPrvMetric) {
        const cordValue = inputs[cordMetric.id];
        const prvValue = inputs[cordPrvMetric.id];

        if (cordValue !== null && cordValue !== undefined &&
            prvValue !== null && prvValue !== undefined) {
            if (prvValue < cordValue) {
                warnings.push({
                    message: `Spinal Canal PRV D0.03cc (${prvValue} Gy) is lower than Spinal Canal D0.03cc (${cordValue} Gy). The PRV should always be ≥ the cord value — check your DVH extraction.`,
                    metricIds: [cordMetric.id, cordPrvMetric.id],
                });
            }
        }
    }

    return warnings;
}

/**
 * Verify that total metric weights sum to the declared total.
 * Useful for integrity checks and unit tests.
 */
export function verifyWeightSum(matrix: ScoringMatrix): {
    valid: boolean;
    computed: number;
    declared: number;
} {
    // Exclude reporting-only metrics from the weight sum
    const computed = matrix.metrics
        .filter(m => !m.reporting_only)
        .reduce((sum, m) => sum + m.weight, 0);
    const declared = matrix.challenge?.scoring?.total_weight ?? computed;
    return {
        valid: computed === declared,
        computed,
        declared,
    };
}

