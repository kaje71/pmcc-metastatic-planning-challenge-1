# Review Report: docs/architectural_map.json (Rev 01)

## Executive Summary
**Status:** Updates in Progress
**Date:** 2026-01-20

This report captures the findings from the initial architectural review and the agreed-upon resolutions.

## 1. Resolved Blockers (P0)

### B1. Spinal Cord & PRV Scoring Logic
**Issue:** Contradiction between soft scoring slope and hard critical fail limit. Ambiguity in "Dmax" vs "D0.03cc".
**Resolution:**
- **Definition:** Enforce **D0.03cc** strictly (removed Dmax ambiguity).
- **Scoring:** Breakpoints updated to award **0 points** at the constraint limit (30.9 Gy).
- **Policy:** Critical fail will **NOT** zero the entire plan score. It will flag the plan as "FAIL" but allow other metrics to be scored for educational iteration.

### B2. Heart V19.5 "Lazy Skip" Loophole
**Issue:** `required: false` allowed skipping the metric without justification.
**Resolution:** Field marked `required: true`. UI must handle the "Not Achievable" toggle to conditionally disable validation/scoring for this field.

## 2. Improvements Included

### H1. Critical Fail Policy
- **Decision:** "Flag only". The calculator will show a "FAIL" status but will still compute and display points for other sections.

### P2. PTV V100% Scoring
- **Decision:** Strictly enforce 0 points for coverage < 90%.

### P2. Heart Dmean
- **Decision:** **Reporting Only**. Field is active and available for input, but `is_scored` is false. Used for data collection and debriefs.

## 3. Validation Notes
- **Text Safety:** Free-text `attempt_notes` will be flagged for human review/validation during implementation to ensuring PII safety heuristic is sufficient.
