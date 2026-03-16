# UI/UX Audit — Phase 0 Baseline

**Date:** 2026-01-20  
**Auditor:** Codex  
**Rubric Version:** 0.1-draft

---

## 1. File Map

### Core Structure

```
pal_lung_planning_challenge/
├── src/
│   ├── App.tsx                     # Main app shell with sidebar nav, routing, attempt storage
│   ├── main.tsx                    # React entry point
│   ├── index.css                   # Global styles, Pete Mac palette vars (partially used)
│   │
│   ├── components/
│   │   ├── ScoreCalculator.tsx     # Main metrics form, live scoring, stacked card layout
│   │   ├── ScoreSummary.tsx        # Sidebar summary panel (points, status, tier)
│   │   ├── ui/
│   │   │   ├── GlassCard.tsx       # Reusable glass-effect card
│   │   │   ├── MetricInput.tsx     # Styled number input with units
│   │   │   └── StatusBadge.tsx     # Pass/fail/warning badge
│   │   └── views/
│   │       ├── Overview.tsx        # About/rationale content
│   │       ├── PlanningBrief.tsx   # Planning instructions
│   │       ├── History.tsx         # Attempt history, export, compare modal
│   │       └── Leaderboard.tsx     # Personal best + tier display (no feature flag)
│   │
│   ├── engine/
│   │   ├── scoring.ts              # computeScore(), piecewiseLinearInterpolation()
│   │   └── scoring.test.ts         # 12 unit tests for scoring engine
│   │
│   ├── data/
│   │   └── config.ts               # Loads scoring_matrix from architectural_map.json
│   │
│   └── types/
│       └── index.ts                # TypeScript interfaces for metrics, scores, attempts
│
├── docs/
│   ├── architectural_map.json      # Master config: criteria, breakpoints, weights, cross-field validations
│   └── papers/                     # Evidence pack PDFs (Table S1, main.pdf, etc.)
│
└── package.json                    # Vite + React 19 + TypeScript + Vitest + TailwindCSS
```

### Key Dependency Versions
- React 19.2.0
- Vite 7.3.1
- TailwindCSS 4.1.18
- Vitest 4.0.17
- No external CDNs (compliant with AGENTS.md)

---

## 2. Current UX Issues

### A. Navigation & Layout
| Issue | Severity | Location |
|-------|----------|----------|
| Desktop uses **left sidebar** navigation (hamburger on mobile) — ops/20_01.md requests **top tab bar** | Medium | `App.tsx` |
| Leaderboard tab **visible by default** — should be feature-flagged off | High | `App.tsx` navItems |
| Dark "slate 950" theme does not match Peter Mac brand purples | High | `tailwind.config.js`, `index.css` |
| Content pages use max-width but calculator grid can feel cramped on narrow screens | Low | `ScoreCalculator.tsx` |

### B. Calculator UX
| Issue | Severity | Location |
|-------|----------|----------|
| **Stacked card layout** requires scrolling to see all metrics — ops/20_01.md requests **dense table** | High | `ScoreCalculator.tsx` |
| Sticky summary is on **right rail** (good) but only on XL screens | Medium | `ScoreCalculator.tsx` |
| No keyboard shortcut for save (Ctrl+S requested) | Medium | `ScoreCalculator.tsx` |
| Tab order follows DOM, not clinical priority | Medium | `ScoreCalculator.tsx` |
| Notes field shows warning about identifiers but does **not block** likely PHI | High | `ScoreCalculator.tsx` |
| Live scoring via `useEffect` with `setResult` triggers lint error | Low | `ScoreCalculator.tsx:71` |

### C. History Page
| Issue | Severity | Location |
|-------|----------|----------|
| Has export CSV/JSON (good) | — | `History.tsx` |
| Has comparison modal (good) | — | `History.tsx` |
| **No trend chart** — ops/20_01.md requires SVG line chart | Medium | `History.tsx` |
| No "personal best" indicator in attempt list | Low | `History.tsx` |
| No "reset all data" button with confirmation | Medium | `History.tsx` |

### D. Leaderboard
| Issue | Severity | Location |
|-------|----------|----------|
| **Not feature-flagged** — visible by default | High | `Leaderboard.tsx`, `App.tsx` |
| Shows tier badges (Elite/Expert/Proficient/Developing) — good | — | `Leaderboard.tsx` |
| "Community Board" placeholder mentions loading from JSON file but currently mocked | Medium | `Leaderboard.tsx` |

---

## 3. Scoring/Rubric Implementation Summary

### Configuration Source
- Uses `docs/architectural_map.json` → `scoring_matrix` section
- Loaded via `src/data/config.ts` using Vite JSON import

### Scoring Engine (`src/engine/scoring.ts`)
- Pure function `computeScore(inputs, config) → ScoreResult`
- Piecewise linear interpolation between breakpoints
- Handles `higher_is_better` and `lower_is_better` directions
- Critical fail policy: `flag_only` mode (still calculates other scores)
- Cross-field validations: V4.5 ≥ V16, V19.5 ≥ V39, percent fraction detection

### Weights (from architectural_map.json)
| Metric | Weight |
|--------|--------|
| PTV V100% | 0.37 |
| Spinal cord PRV D0.03cc | 0.15 |
| Lung Dmean | 0.12 |
| Spinal cord D0.03cc | 0.10 |
| Lung V16 | 0.08 |
| Oesophagus Dmean | 0.08 |
| Lung V4.5 | 0.05 |
| Heart V19.5 | 0.03 |
| Heart V39 | 0.02 |
| Heart Dmean | 0.00 (reporting only) |

### Metric Definition Audit (to verify in Phase 1)
| Metric | Current Label | Paper (S1) Reference | Status |
|--------|---------------|---------------------|--------|
| Spinal cord | D0.03cc | Dmax ≤30.9 Gy | **Needs review** |
| Spinal cord PRV | D0.03cc | Dmax ≤34 Gy | **Needs review** |
| Other OARs | Dmean, Vx | Matches S1 | OK |

---

## 4. Privacy Risks Summary

| Risk | Assessment | Mitigation |
|------|-----------|------------|
| Patient identifiers in notes | **Not blocked** — only warning shown | Implement regex filter + block save |
| localStorage contains metrics | Acceptable per AGENTS.md (no patient IDs in metrics) | OK |
| Export files | Contains metrics + timestamps only | OK |
| No telemetry/analytics | Confirmed — no external calls | OK |
| Community leaderboard | Currently uses mock data, no network calls | Needs feature flag |

---

## 5. Build/Test Status

| Check | Result |
|-------|--------|
| `npm run build` | ✅ PASS — dist/ generated (274KB JS, 14KB CSS) |
| `npm run lint` | ⚠️ 1 ERROR — setState in effect (`ScoreCalculator.tsx:71`) |
| `npm run test` | ✅ PASS — 12/12 tests |

### Lint Error Details
```
src/components/ScoreCalculator.tsx
  71:13  error  Calling setState synchronously within an effect can trigger cascading renders
```
**Recommendation:** Refactor to use `useMemo` for derived state instead of `useEffect` + `setResult`.

---

## 6. Next Steps (Phase 1+)

1. **Phase 1:** Verify constraint values against Supplementary-Table-S1.pdf; fix Dmax vs D0.03cc labelling
2. **Phase 2:** Create Peter Mac design tokens; switch to light theme with purple palette
3. **Phase 3:** Replace sidebar nav with top tab bar; add feature flag for leaderboard
4. **Phase 4:** Rebuild calculator as dense table with sticky summary
5. **Phase 5:** Add trend chart and personal best to History
6. **Phase 6:** Implement feature flag infrastructure; hide community leaderboard
7. **Phase 7:** Expand test coverage for validation and storage
8. **Phase 8:** Update README and deployment docs
