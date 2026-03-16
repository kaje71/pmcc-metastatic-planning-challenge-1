# UI Consistency Audit – PalLung Planning Challenge

**Date:** 2026-01-31  
**Objective:** Identify all UI inconsistencies across pages to inform design system implementation.  
**Canonical Reference:** Anchor Literature page (PaperViewer.tsx) – cleanest hero pattern.

---

## Routes & Pages Identified

| # | Tab ID | Label | View Component | Render Pattern |
|---|--------|-------|----------------|----------------|
| 1 | `introduction` | 1. Welcome | `Overview.tsx` → `PageContentView` | JSON-driven |
| 2 | `fractionation_rationale` | 2. Protocol | `FractionationRationale.tsx` → `PageContentView` | JSON-driven |
| 3 | `paper` | 3. Anchor Literature | `PaperViewer.tsx` | Custom hero + PDF viewer |
| 4 | `clinical_case` | 4. Clinical Case | `ClinicalCase.tsx` → `ClinicalCaseContentView` | Custom section blocks |
| 5 | `planning_guide` | 5. Scoring Rules | `PlanningGuide.tsx` → `PageContentView` | JSON-driven |
| 6 | `calculator` | 6. Calculator | `ScoreCalculator.tsx` | Complex custom layout |

---

## Current Design System Assets

### Existing Token File (`src/styles/tokens.css`)
- **Colors:** Peter Mac brand palette defined (✓)
- **Typography:** Inter font bundled, font sizes use rem scale (✓)
- **Spacing:** Uses a spacing scale `--space-1` to `--space-12` (✓) but missing `--space-7` (gap in scale)
- **Shadows:** Brand-tinted shadows defined (✓)
- **Focus ring:** Defined globally (✓)

### Issues with Current Tokens
1. **Spacing scale incomplete:** Missing `--space-7` (40px) — jumps from `--space-6` (24px) to `--space-8` (32px)
2. **No layout tokens:** Missing `--container-max`, `--page-pad-x`, `--card-pad`, `--section-gap`
3. **No card radius tokens:** Components use hardcoded Tailwind classes (`rounded-xl`)
4. **No typography tokens for headings:** H1/H2/H3 defined in `index.css` but not as reusable vars
5. **Tailwind dependency:** All components use Tailwind classes directly, not CSS variables

---

## Inconsistencies by Category

### 1. Typography

| Page | H1 Size | H2 Size | Body Size | Issues |
|------|---------|---------|-----------|--------|
| **PageContentView** | `text-2xl sm:text-3xl` | `text-lg` | Implicit | ✓ Consistent |
| **PaperViewer** | `text-2xl md:text-3xl` | `font-semibold` (no size) | `text-base md:text-lg` | H2 missing explicit size |
| **ClinicalCaseContentView** | `text-2xl sm:text-3xl` | `text-lg` / `text-base` | Implicit | H2 varies by section type |
| **ScoreCalculator** | `text-lg` (h2 used) | `text-sm` uppercase | Implicit | No H1 at all, uppercase heading labels |

**Key Issues:**
- Calculator page uses `text-lg` for main heading vs `text-2xl` elsewhere
- Inconsistent `font-semibold` vs `font-bold` usage
- Calculator uses uppercase headings (`uppercase tracking-wide`) not used elsewhere
- Variable line-height patterns

### 2. Hero/Page Header Pattern

| Page | Has Eyebrow | Has H1 | Has Subtitle | Has Actions | Background |
|------|-------------|--------|--------------|-------------|------------|
| **PageContentView** | ✓ (optional) | ✓ | ✓ | ✗ | `bg-white rounded-xl` |
| **PaperViewer** | ✓ Chip style | ✓ | ✓ | ✓ (buttons) | `bg-gradient-to-r from-purple-50` |
| **ClinicalCaseContentView** | ✗ | ✓ | ✓ | ✗ | `bg-white rounded-xl` |
| **ScoreCalculator** | ✗ | h2 used | Small text | Keyboard hint | `bg-white rounded-xl` |

**Key Issues:**
- Only PaperViewer has the "eyebrow chip" pattern with icon
- Only PaperViewer has action buttons in hero
- Only PaperViewer has gradient tint background
- ScoreCalculator has no H1 at all – uses h2 styled differently

### 3. Card Patterns

| Component | Radius | Border | Shadow | Padding | Header Style |
|-----------|--------|--------|--------|---------|--------------|
| **PageContentView (header)** | `rounded-xl` | `border-slate-200` | `shadow-sm` | `p-6` | None |
| **PageContentView (content)** | `rounded-xl` | `border-slate-200` | `shadow-sm` | `px-6 py-6 md:px-8 md:py-8` | None |
| **PaperViewer (header)** | `rounded-xl` | `border-slate-200` | `shadow-sm` | `p-6 md:p-8` | Gradient band |
| **PaperViewer (viewer)** | `rounded-xl` | `border-slate-200` | `shadow-sm` | None | Icon + title row |
| **ClinicalCase sections** | `rounded-xl` | `border-slate-200` / varies | `shadow-sm` / `shadow-md` | `px-6 py-6` | Gradient header with icon pill |
| **ScoreCalculator cards** | `rounded-xl` | `border-slate-200` | `shadow-sm` | `p-5` / `p-4` | None / uppercase labels |

**Key Issues:**
- Padding varies: `p-4`, `p-5`, `p-6`, `p-6 md:p-8`
- ClinicalCase uses special gradient headers with icon pills per section
- ClinicalCase Prescription section uses `border-2 border-emerald-200` (thicker, colored)
- Calculator uses smaller padding than other pages

### 4. Section Card Headers

| Pattern | Used In | Style |
|---------|---------|-------|
| **No header** | PageContentView, ScoreCalculator | Just content |
| **Icon pill + title** | ClinicalCaseContentView | `p-2 bg-{color}-100 rounded-lg` pill, gradient header band |
| **Icon + title row** | PaperViewer (viewer section) | Icon left, title text only |
| **Uppercase label** | ScoreCalculator | `text-sm font-bold uppercase tracking-wide` |

**Key Issues:**
- Three different section header patterns across the app
- Icon container sizes inconsistent (some none, some `p-2`, some `p-3`)
- Icon colors vary by section semantically but not standardized

### 5. Button Styles

| Location | Primary Style | Secondary Style | Height |
|----------|---------------|-----------------|--------|
| **Button.tsx** | `bg-pmac-800 h-10` | `bg-white border` `h-10` | 40px |
| **PaperViewer actions** | Uses Button + custom class `h-11` | Uses Button + `h-11` | 44px |
| **ScoreCalculator Save** | Uses Button `h-12` | N/A | 48px |
| **ScoreCalculator Reset** | Custom inline button | N/A | Custom |

**Key Issues:**
- Button heights vary: 40px (default), 44px (PaperViewer), 48px (Calculator)
- Reset button in Calculator doesn't use `<Button>` component
- Navigation buttons in PageContentView use Button correctly

### 6. Table Styles

| Component | Header BG | Row Height | Padding | Borders |
|-----------|-----------|------------|---------|---------|
| **MarkdownBlocks** | `bg-slate-50` | Auto | `px-4 py-3` | `border-slate-200`, hover zebra |
| **ScoreCalculator** | `bg-slate-800` (dark) | Auto | `py-3 px-4` / `py-2 px-2` | `border-slate-100` |

**Key Issues:**
- Calculator has dark header (`bg-slate-800`) vs light header (`bg-slate-50`) in markdown tables
- Calculator bin columns use smaller padding (`py-2 px-2`)
- Completely different visual language

### 7. Spacing / Layout

| Page | Container Max | Page Gap | Card Gap | Inner Padding |
|------|---------------|----------|----------|---------------|
| **App.tsx main** | `max-w-7xl` | `px-4 py-8` | N/A | N/A |
| **PageContentView** | `max-w-4xl` | `space-y-6` | divider | `px-6 py-6` |
| **PaperViewer** | `max-w-4xl` | `space-y-6` | N/A | `p-6 md:p-8` |
| **ClinicalCaseContentView** | `max-w-5xl` | `space-y-6` | N/A | `px-6 py-6` |
| **ScoreCalculator** | None (full) | `space-y-4` / `gap-6` | N/A | `p-4` / `p-5` |

**Key Issues:**
- Three different max-widths: `max-w-4xl`, `max-w-5xl`, `max-w-7xl`
- Spacing varies: `space-y-4` vs `space-y-6`
- Calculator fills full width (no container)

### 8. Icon Sizing

| Context | Size | Stroke | Issues |
|---------|------|--------|--------|
| **Header nav** | `h-5 w-5` | Default | ✓ |
| **PaperViewer chip** | `w-3.5 h-3.5` | Default | Smaller |
| **ClinicalCase section icon** | `w-5 h-5` | Default | ✓ |
| **Calculator direction** | `w-3 h-3` | Default | Very small |
| **Button icons** | `w-4 h-4` | Default | ✓ Consistent |
| **Callout icons** | `h-5 w-5` | Default | ✓ |

**Key Issues:**
- Icon sizes range from `w-3 h-3` to `w-5 h-5` without clear rationale
- No defined icon size tokens/standards

---

## Recommendations for Design System

### 1. Layout Tokens (Add)
```css
--container-max: 1240px;
--container-content: 896px; /* max-w-4xl equivalent */
--page-pad-x: 32px;
--page-pad-y: 32px;
--section-gap: 32px;
--card-gap: 24px;
--card-pad: 24px;
```

### 2. Fix Spacing Scale
Add missing step:
```css
--space-7: 40px; /* Currently missing */
```

### 3. Card Tokens (Add)
```css
--radius-card: 18px;
--radius-control: 12px;
--shadow-card: var(--shadow-sm);
--border-card: 1px solid rgba(15, 23, 42, 0.08);
```

### 4. Typography Scale (Standardize)
```css
/* Enforce via components or classes */
H1: 40px / 700 / tight tracking
H2: 24px / 600 / tight tracking
H3: 18px / 600 / tight tracking
Body: 15-16px / 400 / relaxed
Small: 13px / 400
Eyebrow: 12px / 650 / uppercase / 0.06em tracking
```

### 5. Required UI Primitives

1. **`<PageShell>`** – Wraps pages with consistent container/padding
2. **`<PageHero>`** – Standardized hero pattern (eyebrow + H1 + subtitle + actions)
3. **`<SectionCard>`** – Consistent card with optional icon header
4. **`<EyebrowChip>`** – Label chip for heroes/headers
5. **`<DataTable>`** – Standardized table styling
6. **`<KeyValueGrid>`** – For clinical case-style data display

---

## Priority Actions

### P0 – Critical (Consistency)
1. Create `PageShell` wrapper and apply to all pages
2. Create `PageHero` and unify all page headers
3. Unify card padding to single value (`--card-pad: 24px`)
4. Remove uppercase headings from Calculator
5. Standardize Button heights to 40px (use component sizing)

### P1 – Important (Polish)
1. Create `SectionCard` component with optional header variants
2. Unify table header style (light background everywhere)
3. Standardize icon sizes (nav: 20px, card: 20px, inline: 16px)
4. Add missing spacing tokens

### P2 – Nice to Have
1. Create `EyebrowChip` component
2. Create stack utility classes
3. Document component usage guidelines

---

## Files to Modify

| File | Changes Needed |
|------|----------------|
| `src/styles/tokens.css` | Add layout/card tokens, fix spacing scale |
| `src/styles/typography.css` | NEW – Typography utility classes |
| `src/index.css` | Add stack utilities, paragraph rhythm |
| `src/components/ui/PageShell.tsx` | NEW – Page container wrapper |
| `src/components/ui/PageHero.tsx` | NEW – Unified page header |
| `src/components/ui/SectionCard.tsx` | NEW – Content card with header options |
| `src/components/content/PageContentView.tsx` | Refactor to use new primitives |
| `src/components/content/ClinicalCaseContentView.tsx` | Refactor to use new primitives |
| `src/components/views/PaperViewer.tsx` | Refactor to use new primitives |
| `src/components/ScoreCalculator.tsx` | Major refactor: add PageHero, unify cards |
| `src/components/ui/Button.tsx` | Add icon standardization |
