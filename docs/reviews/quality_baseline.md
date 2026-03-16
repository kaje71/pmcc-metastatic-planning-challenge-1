# Quality Baseline Audit — Phase 0

**Date:** 2026-01-21  
**Auditor:** Codex  
**Rubric Version:** 0.1-draft

---

## 1. File Structure & Responsibilities

```
src/
├── App.tsx                        # Main app shell: tabs (Overview|Brief|Calculator|History|Leaderboard), attempt storage
├── main.tsx                       # React entry point
├── index.css                      # Global CSS with Peter Mac tokens
│
├── components/
│   ├── ScoreCalculator.tsx        # Main calculator: table-based input form, live scoring
│   ├── ScoreSummary.tsx           # Sticky right rail: totals, subscores, tier badge
│   ├── layout/Header.tsx          # Top header with nav tabs, Peter Mac gradient
│   ├── ui/                        # Reusable components (Button, Toast, StatusIcon, etc.)
│   └── views/                     # Page content (Overview, PlanningBrief, History, Leaderboard)
│
├── engine/
│   ├── scoring.ts                 # Pure function: computeScore(), piecewiseLinearInterpolation()
│   └── scoring.test.ts            # 14 unit tests for scoring engine
│
├── utils/
│   ├── storage.ts                 # localStorage wrapper for attempts
│   ├── identifierCheck.ts         # PHI detection (regex patterns)
│   └── identifierCheck.test.ts    # 17 tests for identifier detection
│
├── data/config.ts                 # Loads scoring_matrix from architectural_map.json
└── types/index.ts                 # TypeScript interfaces
```

### Rubric/Constraints Location
- **Source:** `docs/architectural_map.json` → `scoring_matrix` section
- **Loader:** `src/data/config.ts` (exports `getScoringMatrix()`, `getAllCriteria()`)
- **Evidence pack:** `docs/papers/*.pdf` (Table S1 is authoritative for OAR constraints)

---

## 2. Repo Check Results

| Check | Command | Result |
|-------|---------|--------|
| TypeScript | `npm run build` | ❌ **FAIL** — 1 error |
| Lint | `npm run lint` | ❌ **FAIL** — 4 errors |
| Test | `npm run test` | ✅ **PASS** — 31/31 |

### Build Error
```
src/components/layout/Header.tsx(19,50): error TS6133: 'rubricVersion' is declared but its value is never read.
```

### Lint Errors
| File | Error |
|------|-------|
| `Header.tsx:19` | Unused `rubricVersion` parameter |
| `PerformanceSpectrum.tsx:114,144` | `@typescript-eslint/no-explicit-any` (2 occurrences) |
| `Toast.tsx:28` | `react-refresh/only-export-components` (exports non-component) |

---

## 3. Current UI Shortcomings vs Target

| Target Requirement | Current State | Gap |
|--------------------|---------------|-----|
| High-density table with minimal scrolling | Table layout implemented but can be denser | Medium |
| Sticky Score panel always visible | Right rail, XL+ screens only | Medium |
| Points + Status per row (live) | ✅ Implemented | None |
| Total/Subscores/Critical Fail visible | ✅ ScoreSummary shows these | None |
| Tier badge (Developing/Proficient/Expert/Elite) | ✅ Implemented in ScoreSummary | None |
| "Top improvements" suggestions | ❌ Not implemented | **P0** |
| Enter/Shift+Enter field navigation | ❌ Not implemented | **P1** |
| Ctrl+S save shortcut | ✅ Implemented | None |
| Error summary at top (clickable) | Partial — inline errors but no summary | Medium |
| "Skip to calculator inputs" link | Skip link exists, targets `#main-content` | Low (needs refinement) |

---

## 4. Evidence/Constraint Mismatches

### Current Breakpoints (from architectural_map.json)

| Metric | Current Value | S1 Paper Value | Status |
|--------|---------------|----------------|--------|
| Spinal cord Dmax | ≤30.9 Gy | Dmax ≤30.9 Gy | ✅ Matches |
| Spinal cord PRV Dmax | ≤34.0 Gy | Dmax ≤34.0 Gy | ✅ Matches |
| Oesophagus Dmean | ≤26.5 Gy | Dmean ≤26.5 Gy | ✅ Matches |
| Lung Dmean (1st) | ≤16.0 Gy | Need to verify | ⚠️ Review |
| Lung Dmean (2nd) | ≤17.3 Gy | Need to verify | ⚠️ Review |
| Lung V16 (1st) | ≤30% | Need to verify | ⚠️ Review |
| Lung V16 (2nd) | ≤37% | Need to verify | ⚠️ Review |
| Lung V4.5 (1st) | ≤60% | Need to verify | ⚠️ Review |
| Lung V4.5 (2nd) | ≤70% | Need to verify | ⚠️ Review |
| Heart V19.5 | ≤10% (if achievable) | Need to verify | ⚠️ Review |
| Heart V39 | ≤25% | Need to verify | ⚠️ Review |
| Heart Dmean | Not scored (weight=0) | Ambiguous in S1 | ✅ Correctly flagged |

### Definition Issues
| Issue | Current Handling | Required Action |
|-------|------------------|-----------------|
| Dmax vs D0.03cc | UI labels say "0.03cc" but paper uses "Dmax" | **Phase 1:** Clarify and align labels |
| Heart Dmean tiers | "1st <23.4 Gy, 2nd <15.6 Gy" appears inverted | Correctly set to weight=0 pending adjudication |

---

## 5. Accessibility Gaps

| WCAG Requirement | Current State | Gap |
|------------------|---------------|-----|
| Visible focus rings | CSS exists but may need stronger contrast | Review needed |
| Keyboard-only tab order | DOM order, not clinical priority | **Phase 4** |
| Error summary with count | Not implemented | **Phase 4** |
| ARIA labels/describedby | Partial implementation | Review needed |
| Skip link | ✅ Present | Refine target |
| Table headers (th/scope) | Component uses `th` but semantic review needed | **Phase 7** |

---

## 6. Privacy Risks

| Risk | Current Mitigation | Status |
|------|-------------------|--------|
| Identifiers in notes | `identifierCheck.ts` with 17 tests; blocks save | ✅ Implemented |
| localStorage data | Stores only metrics, scores, timestamps, notes | ✅ Compliant |
| Export files | Contains metrics + timestamps only | ✅ Compliant |
| External network calls | None (no CDNs, no analytics) | ✅ Compliant |
| Leaderboard feature | Feature-flagged (controlled by `featureFlags.ts`) | ✅ Compliant |

---

## 7. Maintainability Assessment

| Aspect | Assessment |
|--------|------------|
| Scoring engine | Pure function, well-tested (14 tests), JSON-configurable |
| Validations | Cross-field validations in config, tested |
| Storage | Simple localStorage wrapper, no tests yet |
| UI coupling | Calculator has some inline scoring display logic — acceptable |
| Test coverage | Good for scoring (14) and identifier check (17); storage needs tests |

---

## 8. SharePoint Deployability

| Requirement | Status |
|-------------|--------|
| Static bundle | ✅ Vite builds to `/dist` |
| No CDNs | ✅ All assets bundled |
| Hashed filenames | ✅ Vite default behavior |
| Inline scripts | No CSP issues expected |
| DEPLOYMENT docs | ❌ Not yet created |

---

## 9. Phase 1 Priority Items

1. **P0:** Verify all constraint values against Supplementary-Table-S1.pdf
2. **P0:** Resolve Dmax vs D0.03cc labeling (default to paper's definition)
3. **P0:** Fix build error (unused `rubricVersion` in Header.tsx)
4. **P0:** Fix lint errors (any types, export warning)
5. **P1:** Add unit tests for storage module
6. **P1:** Implement "Top improvements" calculation

---

## Acceptance: Phase 0 Complete

- [x] File structure mapped
- [x] Repo checks run (typecheck fail, lint fail, test pass)
- [x] quality_baseline.md created with gaps identified
- [ ] Build must pass before Phase 1 code changes (fix TS error first)
