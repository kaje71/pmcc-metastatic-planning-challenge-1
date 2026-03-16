/**
 * Configuration loader for rubric metadata.
 */
import calculatorData from '../../text/5_calculator.json' with { type: 'json' };

// Calculator JSON structure
interface CalculatorJson {
    rubric_version?: string;
    [key: string]: unknown;
}

// Type the imported data
const calculatorJson = calculatorData as unknown as CalculatorJson;

/**
 * Returns the rubric version string.
 * Gets the version from the calculator JSON file (5_calculator.json).
 */
export function getRubricVersion(): string {
    return calculatorJson.rubric_version || 'unknown';
}
