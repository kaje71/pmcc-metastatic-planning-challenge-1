import { describe, it, expect } from 'vitest';
import calculatorData from '../../text/5_calculator.json' with { type: 'json' };
import { calculateScore, evaluateBin, scoreMetric, validateInput, crossFieldValidate, verifyWeightSum } from './scoringEngine';
import type { ScoringMatrix, ScoringMetric } from '../types/scoringTypes';

const matrix = calculatorData as unknown as ScoringMatrix;

function buildIdealInputs(): Record<number, number> {
    const inputs: Record<number, number> = {};
    matrix.metrics.forEach((metric) => {
        // Reporting-only metrics: just enter a plausible value
        if ((metric as ScoringMetric & { reporting_only?: boolean }).reporting_only) {
            inputs[metric.id] = 20.0;
            return;
        }

        const idealBin = metric.bins[metric.bins.length - 1];
        let value = 0;
        if (metric.direction === 'higher_is_better') {
            value = idealBin.gte ?? (idealBin.gt ? idealBin.gt + 0.1 : 100);
        } else {
            value = idealBin.lte ?? (idealBin.lt ? idealBin.lt - 0.1 : 0);
        }
        inputs[metric.id] = value;
    });
    return inputs;
}

const scoredMetrics = matrix.metrics.filter(
    (m) => !(m as ScoringMetric & { reporting_only?: boolean }).reporting_only
);
const expectedTotal = scoredMetrics.reduce((sum, m) => sum + m.weight, 0);

describe('scoringEngine', () => {
    it('returns full score for ideal inputs', () => {
        const inputs = buildIdealInputs();
        const result = calculateScore(inputs, matrix);
        expect(result.totalScore).toBeCloseTo(expectedTotal, 5);
        expect(result.maxScore).toBeCloseTo(expectedTotal, 5);
        expect(result.percentage).toBeCloseTo(100, 5);
    });

    it('handles boundary for spinal canal (30.9 Gy)', () => {
        const metric = matrix.metrics.find(m => m.structure === 'SpinalCanal');
        if (!metric) throw new Error('SpinalCanal metric missing');
        const bin = evaluateBin(30.9, metric);
        expect(bin?.label).toBe('acceptable');
    });

    it('flags hard-gate failure when spinal canal exceeds limit', () => {
        const inputs = buildIdealInputs();
        const cordMetric = matrix.metrics.find(m => m.structure === 'SpinalCanal');
        if (!cordMetric) throw new Error('SpinalCanal metric missing');
        inputs[cordMetric.id] = 31.0;
        const result = calculateScore(inputs, matrix);
        expect(result.hardGateFailed).toBe(true);
        expect(result.hardGateFailures.length).toBeGreaterThan(0);
    });
});

describe('reporting-only metrics', () => {
    it('reporting-only metric returns 0/0 points and does not affect total', () => {
        const reportingMetric = matrix.metrics.find(
            (m) => (m as ScoringMetric & { reporting_only?: boolean }).reporting_only
        );
        if (!reportingMetric) throw new Error('No reporting-only metric found');

        const result = scoreMetric(20.0, reportingMetric);
        expect(result.points).toBe(0);
        expect(result.maxPoints).toBe(0);
        expect(result.binLabel).toBe('reporting');
        expect(result.status).toBe('pass');
    });

    it('reporting-only metric does not affect total or completeness', () => {
        // Build inputs with all scored metrics filled, but reporting-only missing
        const inputs: Record<number, number | null> = {};
        matrix.metrics.forEach((metric) => {
            if ((metric as ScoringMetric & { reporting_only?: boolean }).reporting_only) {
                inputs[metric.id] = null; // leave reporting-only empty
            } else {
                const idealBin = metric.bins[metric.bins.length - 1];
                if (metric.direction === 'higher_is_better') {
                    inputs[metric.id] = idealBin.gte ?? 100;
                } else {
                    inputs[metric.id] = idealBin.lte ?? 0;
                }
            }
        });
        const result = calculateScore(inputs, matrix);
        expect(result.planStatus).not.toBe('INCOMPLETE');
        expect(result.totalScore).toBeCloseTo(expectedTotal, 5);
    });
});

describe('validateInput', () => {
    it('returns null for values within plausible range', () => {
        const metric = matrix.metrics.find(m => m.unit === '%');
        if (!metric) throw new Error('No % metric found');
        expect(validateInput(50, metric)).toBeNull();
    });

    it('returns error for negative percentage values', () => {
        const metric = matrix.metrics.find(m => m.unit === '%');
        if (!metric) throw new Error('No % metric found');
        const result = validateInput(-5, metric);
        expect(result).not.toBeNull();
        expect(result!.severity).toBe('error');
    });

    it('returns warning for percentage values above 120', () => {
        const metric = matrix.metrics.find(m => m.unit === '%');
        if (!metric) throw new Error('No % metric found');
        const result = validateInput(200, metric);
        expect(result).not.toBeNull();
        expect(result!.severity).toBe('warning');
    });

    it('returns warning for Gy values above 100', () => {
        const metric = matrix.metrics.find(m => m.unit === 'Gy');
        if (!metric) throw new Error('No Gy metric found');
        const result = validateInput(500, metric);
        expect(result).not.toBeNull();
        expect(result!.severity).toBe('warning');
    });
});

describe('crossFieldValidate', () => {
    it('returns no warnings when cord PRV >= cord', () => {
        const inputs = buildIdealInputs();
        const warnings = crossFieldValidate(inputs, matrix);
        expect(warnings).toHaveLength(0);
    });

    it('returns a warning when cord PRV < cord D0.03cc', () => {
        const inputs = buildIdealInputs();
        const cordMetric = matrix.metrics.find(m => m.structure === 'SpinalCanal' && m.statistic === 'D0.03cc');
        const prvMetric = matrix.metrics.find(m => m.structure === 'SpinalCanal_PRV' && m.statistic === 'D0.03cc');
        if (!cordMetric || !prvMetric) throw new Error('Cord/PRV metrics missing');
        inputs[cordMetric.id] = 25.0;
        inputs[prvMetric.id] = 20.0; // PRV lower than cord — physically impossible
        const warnings = crossFieldValidate(inputs, matrix);
        expect(warnings).toHaveLength(1);
        expect(warnings[0].metricIds).toContain(cordMetric.id);
    });
});

describe('verifyWeightSum', () => {
    it('total scored metric weights sum to declared total (150)', () => {
        const result = verifyWeightSum(matrix);
        expect(result.valid).toBe(true);
        expect(result.computed).toBe(150);
        expect(result.declared).toBe(150);
    });
});
