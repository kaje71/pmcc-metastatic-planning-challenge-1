/**
 * Identifier Check Utility
 * 
 * Detects likely patient identifiers in text to prevent storage of PHI.
 * Used to block save when notes contain MRN, patient names, etc.
 */

// Common patterns that suggest patient identifiers
const IDENTIFIER_PATTERNS: { pattern: RegExp; type: string }[] = [
    // MRN/UR patterns (6-8 digit numbers, often with prefix)
    { pattern: /\b(MRN|UR|URN|ID)[:\s#]*\d{5,10}\b/i, type: 'MRN' },
    { pattern: /\b\d{7,10}\b/, type: 'Possible MRN (7+ digit number)' },

    // Patient name patterns (titles followed by name-like words)
    { pattern: /\b(Mr|Mrs|Ms|Miss|Dr)\.?\s+[A-Z][a-z]+\b/i, type: 'Possible patient name' },

    // "Patient: Name" or "Pt: Name" patterns
    { pattern: /\b(patient|pt)[:\s]+[A-Z][a-z]+(\s+[A-Z][a-z]+)?\b/i, type: 'Patient name reference' },

    // Date of birth patterns
    { pattern: /\b(DOB|birth)[:\s]*([\d]{1,2}[/-][\d]{1,2}[/-][\d]{2,4})\b/i, type: 'Date of birth' },

    // Plan ID patterns (common TPS naming)
    { pattern: /\bplan[:\s#]*[A-Z0-9]{3,}[-_]?\d+\b/i, type: 'Plan ID' },

    // Accession numbers
    { pattern: /\b(accession|acc)[:\s#]*\d{6,}\b/i, type: 'Accession number' },

    // Email addresses (staff or patient)
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/i, type: 'Email address' },

    // Medicare numbers (Australian format)
    { pattern: /\b\d{4}\s?\d{5}\s?\d{1}\b/, type: 'Possible Medicare number' },
];

// Words/phrases that always trigger a warning
const BLOCKED_KEYWORDS = [
    'patient name',
    'patient id',
    'medical record',
    'chart number',
    'hospital number',
];

export interface IdentifierCheckResult {
    hasIdentifier: boolean;
    matches: { type: string; match: string }[];
    message: string;
}

/**
 * Check if text contains likely patient identifiers.
 * 
 * @param text - The text to check (typically from notes field)
 * @returns Result indicating if identifiers were found
 */
export function checkForIdentifiers(text: string): IdentifierCheckResult {
    const matches: { type: string; match: string }[] = [];
    const normalizedText = text.toLowerCase();

    // Check for blocked keywords
    for (const keyword of BLOCKED_KEYWORDS) {
        if (normalizedText.includes(keyword)) {
            matches.push({ type: 'Blocked keyword', match: keyword });
        }
    }

    // Check regex patterns
    for (const { pattern, type } of IDENTIFIER_PATTERNS) {
        const match = text.match(pattern);
        if (match) {
            matches.push({ type, match: match[0] });
        }
    }

    const hasIdentifier = matches.length > 0;
    const message = hasIdentifier
        ? `Possible identifier detected: ${matches.map(m => m.type).join(', ')}. Remove before saving.`
        : '';

    return { hasIdentifier, matches, message };
}

/**
 * Simple boolean check for blocking save.
 */
export function containsIdentifier(text: string): boolean {
    return checkForIdentifiers(text).hasIdentifier;
}
