# Clinical Case Content Audit
**Phase:** 0 - Content Validation  
**Date:** 2026-01-31  
**Reviewer:** Sonet (UX Designer + Senior Front-End Engineer)

## Executive Summary
The Clinical Case JSON content at `text/3_clinical_case.json` has been validated and is ready for consumption by the UI refactor. The content is well-structured, clinically professional, and follows the established schema conventions used across the site.

---

## File Location
**Path:** `text/3_clinical_case.json`  
**Schema Version:** 1.0  
**Status:** ✅ Valid and complete

---

## Schema Validation

### Top-Level Fields
| Field | Required | Present | Notes |
|-------|----------|---------|-------|
| `schema_version` | ✅ | ✅ | "1.0" |
| `page` | ✅ | ✅ | Complete metadata |
| `sections` | ✅ | ✅ | 6 sections defined |
| `crosslinks` | ✅ | ✅ | Both prev and next links present |

### Page Metadata
| Field | Value |
|-------|-------|
| `id` | "clinical_case" |
| `order` | 3 |
| `nav_label` | "Clinical case" |
| `title` | "Clinical case" |
| `subtitle` | "Case context and case-specific clinical intent" |

### Crosslinks
- **Previous:** `fractionation_rationale` ("Back: 40 Gy/10 fx")
- **Next:** `planning_guide` ("Next: Planning guide & scorecard")

---

## Section Inventory

The JSON defines **6 sections** in the following order:

### 1. `case_summary`
**Title:** "Case summary (fictional academic case)"  
**Line Count:** 18 markdown lines  
**Content Type:**
- Lead paragraphs (context-setting)
- Nested H3 heading: "Referral snapshot"
- Bullet list (patient demographic/clinical summary)
- Nested H3 heading: "Why this case is challenging (by design)"
- Bullet list (planning trade-offs)
- Closing paragraph

**Special Rendering Needs:**
- Mid-section H3 headings (`###`) should render as subsection headers
- Bullet lists with clinical metadata (patient age, diagnosis, symptoms)

**Visual Treatment Recommendation:**
- **Prominent lead card** with clinical summary icon
- **Referral snapshot** as a sub-block (key/value grid or compact list)
- **Challenge rationale** as a highlighted callout

---

### 2. `clinical_intent`
**Title:** "Clinical intent"  
**Line Count:** 26 markdown lines  
**Content Type:**
- Multiple H3 subsections:
  - "Intent: high-dose palliative thoracic RT with a durability mindset"
  - "Why palliative (not definitive chemoradiation)"
  - "Why 40 Gy in 10 fractions (for this patient, in this geometry)"
  - "Why not SBRT"
  - "Systemic therapy coordination assumption for the challenge"
- Mixed paragraphs and bullet lists
- One emphasized callout: "Key constraints in this scenario"

**Special Rendering Needs:**
- Multiple nested H3 headings
- Bold inline emphasis (`**...**`)
- Clinical reasoning structure (question → answer pattern)

**Visual Treatment Recommendation:**
- **Structured card** with "Intent" as the primary headline
- **Subsections as accordion or clean vertical flow** (desktop-first, no need to collapse)
- **Key constraints** bullet list as a highlighted callout box
- Icon suggestion: target/goal icon

---

### 3. `simulation_imaging`
**Title:** "Simulation / imaging (as per dataset)"  
**Line Count:** 9 markdown lines  
**Content Type:**
- Two H3 subsections:
  - "Dataset imaging assumptions"
  - "Structures"
- Short bullet lists
- Brief practical notes

**Special Rendering Needs:**
- Compact, factual content
- No long prose

**Visual Treatment Recommendation:**
- **Smaller "Dataset + imaging" info card**
- Icon suggestion: scanner/imaging icon (simple line icon)
- Keep visual weight lower than clinical intent or case summary

---

### 4. `prescription`
**Title:** "Prescription used in this challenge"  
**Line Count:** 4 markdown lines  
**Content Type:**
- Bold prescription text: "40 Gy in 10 daily fractions"
- Brief planning context
- Scorecard calibration note

**Special Rendering Needs:**
- The dose "40 Gy in 10 daily fractions (4 Gy per fraction)" should be visually prominent
- This is a key clinical reference point

**Visual Treatment Recommendation:**
- **High-salience prescription chip/card**
- Large, bold "40 Gy / 10" emphasis (consider typographic hierarchy: large numbers, smaller units)
- Icon suggestion: dose/prescription icon
- Consider a distinct color or border to draw attention

---

### 5. `clinical_takeaways`
**Title:** "Clinical takeaways for planners"  
**Line Count:** 8 markdown lines  
**Content Type:**
- Two H3 subsections:
  - "What this case is really training"
  - "Fast-turnaround realism (the point of the challenge)"
- Bullet lists (4 items in first section)
- Short explanatory paragraph in second section

**Special Rendering Needs:**
- Bullet lists with clinical learning points
- Each bullet is a standalone takeaway

**Visual Treatment Recommendation:**
- **2-column grid of takeaway cards** (desktop)
- Each takeaway as a short heading + one sentence
- Keep scannable and high-signal
- Icons: warning/shield/clock icons (depending on theme)
- Consider using colored accent borders or badges

---

### 6. `next_step`
**Title:** "Next step"  
**Line Count:** 1 markdown line  
**Content Type:**
- Single line directing user to next page

**Special Rendering Needs:**
- This is effectively a CTA

**Visual Treatment Recommendation:**
- **CTA strip/card** with "Next" button
- Use crosslinks.next for the target
- Could be merged with the navigation footer (already present in `PageContentView`)
- May be redundant with existing crosslinks footer

---

## Content Quality Assessment

### ✅ Strengths
1. **Clinically accurate and plausible**: Fictional case is well-constructed
2. **No patient identifiers**: All content is de-identified
3. **Consistent voice**: Professional, educational tone throughout
4. **Clear structure**: Logical flow from case summary → intent → dataset → prescription → takeaways
5. **Markdown formatting**: Proper use of H3 headings, bold/italic, and bullet lists

### ⚠️ Considerations
1. **Mid-section headings**: Several sections contain multiple H3 headings, which need to be rendered as subsections (not section titles)
2. **Visual hierarchy**: Current generic renderer may not distinguish between different section types (e.g., prescription vs imaging)
3. **Scannability**: Long sections like `clinical_intent` would benefit from visual breaks or progressive disclosure on mobile

---

## Rendering Implications

### Current Implementation
- **Page Component:** `src/components/views/ClinicalCase.tsx`
- **Content Loader:** `src/data/clinicalCase.ts`
- **Renderer:** `src/components/content/PageContentView.tsx`
- **Markdown Parser:** `src/components/content/MarkdownBlocks.tsx`

### Current Rendering Pattern
All sections are rendered identically:
```tsx
<section key={section.id} className="px-6 py-6 md:px-8 md:py-8">
  <h2>{section.title}</h2>
  <MarkdownBlocks lines={section.body_markdown_lines} />
</section>
```

### Recommended Changes
1. **Section-specific rendering:** Map each `section.id` to a dedicated component with appropriate visual treatment
2. **Icon system:** Reuse existing icon system (lucide-react is already in use)
3. **Desktop-first layout:** Maintain max-width ~1200–1400px, comfortable margins
4. **Micro-graphics:** Subtle icons for each section (aid scanning, not decoration)
5. **Progressive disclosure:** Consider "More detail" toggles for long sections (but default view should be high-signal)

---

## Next Steps (PHASE 1)
1. Confirm Clinical Case page is fully JSON-driven (no hard-coded content)
2. Ensure markdown renderer handles all content types correctly
3. Validate that updating JSON updates UI without code changes

---

## Appendix: Section IDs (in order)
1. `case_summary`
2. `clinical_intent`
3. `simulation_imaging`
4. `prescription`
5. `clinical_takeaways`
6. `next_step`
