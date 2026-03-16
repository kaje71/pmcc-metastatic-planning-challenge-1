/**
 * Unit tests for identifier check utility.
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { checkForIdentifiers, containsIdentifier } from './identifierCheck';

describe('checkForIdentifiers', () => {
    describe('should detect MRN patterns', () => {
        it('detects MRN with prefix', () => {
            const result = checkForIdentifiers('MRN: 1234567');
            expect(result.hasIdentifier).toBe(true);
            expect(result.matches.some(m => m.type === 'MRN')).toBe(true);
        });

        it('detects UR number', () => {
            const result = checkForIdentifiers('UR 98765432');
            expect(result.hasIdentifier).toBe(true);
        });

        it('detects long digit sequences', () => {
            const result = checkForIdentifiers('Patient ID is 1234567890');
            expect(result.hasIdentifier).toBe(true);
        });
    });

    describe('should detect patient name patterns', () => {
        it('detects Mr/Mrs/Ms prefix', () => {
            const result = checkForIdentifiers('Plan for Mr Smith');
            expect(result.hasIdentifier).toBe(true);
            expect(result.matches.some(m => m.type.includes('name'))).toBe(true);
        });

        it('detects "Patient:" prefix', () => {
            const result = checkForIdentifiers('Patient: John Doe');
            expect(result.hasIdentifier).toBe(true);
        });

        it('detects "Pt:" abbreviation', () => {
            const result = checkForIdentifiers('Pt: Smith');
            expect(result.hasIdentifier).toBe(true);
        });
    });

    describe('should detect blocked keywords', () => {
        it('detects "patient name"', () => {
            const result = checkForIdentifiers('Do not include patient name');
            expect(result.hasIdentifier).toBe(true);
            expect(result.matches.some(m => m.type === 'Blocked keyword')).toBe(true);
        });

        it('detects "medical record"', () => {
            const result = checkForIdentifiers('Attach medical record');
            expect(result.hasIdentifier).toBe(true);
        });
    });

    describe('should detect date of birth', () => {
        it('detects DOB with slashes', () => {
            const result = checkForIdentifiers('DOB: 01/15/1985');
            expect(result.hasIdentifier).toBe(true);
        });

        it('detects birth with dashes', () => {
            const result = checkForIdentifiers('birth: 15-01-85');
            expect(result.hasIdentifier).toBe(true);
        });
    });

    describe('should detect email addresses', () => {
        it('detects standard email', () => {
            const result = checkForIdentifiers('Contact: john.doe@hospital.com');
            expect(result.hasIdentifier).toBe(true);
            expect(result.matches.some(m => m.type === 'Email address')).toBe(true);
        });
    });

    describe('should allow safe notes', () => {
        it('allows clinical observation notes', () => {
            const result = checkForIdentifiers('Good target coverage, could reduce lung dose');
            expect(result.hasIdentifier).toBe(false);
        });

        it('allows technique notes', () => {
            const result = checkForIdentifiers('Used 2 full arcs VMAT, 6MV');
            expect(result.hasIdentifier).toBe(false);
        });

        it('allows short numbers', () => {
            const result = checkForIdentifiers('V95 was 98.5%, canal D0.03cc 25.3 Gy');
            expect(result.hasIdentifier).toBe(false);
        });

        it('allows empty string', () => {
            const result = checkForIdentifiers('');
            expect(result.hasIdentifier).toBe(false);
        });
    });
});

describe('containsIdentifier', () => {
    it('returns true for identifier text', () => {
        expect(containsIdentifier('MRN 1234567')).toBe(true);
    });

    it('returns false for safe text', () => {
        expect(containsIdentifier('Good plan quality')).toBe(false);
    });
});
