# Metastatic Thorax Challenge Hub — AGENTS.md

This repository powers an internal **planning challenge** website used for education and benchmarking in radiotherapy planning.

The site is intentionally **content-driven**: new challenges should be created by adding a new *challenge pack* (content + rubric), not by changing application code.

For the authoritative information architecture (routes, tabs, required files, schemas), see **`architectural_map.json`**.

---

## 1) Mission and scope

### What this project is
- A structured way to run **short-turnaround planning challenges**.
- A place to host **case narrative + literature context + planning guide + a fixed scorecard + a scoring calculator**.
- A light-weight way for learners to keep a **personal attempt history** (numbers only).

### What this project is not
- Not a clinical decision support system.
- Not an endorsed treatment protocol.
- Not a patient record system (no PHI/PII, no DICOM storage).

---

## 2) Non-negotiables

### Privacy and safety
- **Never** store or display patient-identifying information (names, MRNs, DOBs, dates of service).
- Attempt history must store **metrics and scores only**, plus optional learner notes that must remain non-identifying.
- Do not add features that ingest or persist DICOM objects in-browser unless there is a formal privacy review.

### Deterministic scoring
- Scoring must be reproducible from the rubric:
  - Same inputs → same per-metric bin → same points → same total.
- If the rubric changes, it must be versioned and the change must be documented (and ideally the UI should show which rubric version was used for a saved attempt).

### Content-first architecture
- Application code should be **generic**.
- Challenge packs are the only thing that should change between challenges.

---

## 3) Information architecture (tabs and flow)

Primary tabs must remain in this order (see `architectural_map.json`):

1. **Introduction**  
   What a planning challenge is, why we do it, and how to use the site.

2. **Clinical case**  
   Case context (patient table, DICOM download, spatial anatomy, clinical intent) — concise, operational.

3. **Planning guide & scorecard**  
   Structure glossary, how scoring works, and the fixed scoring matrix — operational reference only.

4. **Scoring calculator**  
   Data entry + scoring breakdown + (optional) personal attempt history entry point.

5. **Supplementary**  
   Regimen rationale, radiobiology (BED/α/β, BED₃ safety floor), scoring methodology (CN formula, constraint provenance, TPS variability), cumulative dose, cohort data, evidence limitations, and the full paper viewer.

**Rationale:** Tabs 1–4 are concise "what to do and how"; Tab 5 houses all teaching and evidence material.

---

## 4) Challenge pack template

A challenge pack lives at:

`text/`

Required files (by convention):

- `1_introduction.json` — page content
- `2_fractionation_rationale.json` — page content (literature deep‑dive)
- `3_clinical_case.json` — page content
- `4_planning_guide_scorecard.json` — page content (includes the fixed scorecard table)
- `5_calculator.json` — rubric + calculator copy (and any calculator-specific metadata)
- `golden_case.json` — test vector with expected bins and total score

Optional files:

- `resources.json` (downloads, links, PDFs)
- `images/` (figures, diagrams)
- `downloads/` (datasets, if appropriate for your environment and governance)

---

## 5) Page content schema (recommended)

Page content files should be valid JSON and remain **layout-agnostic**.

Minimum structure:

```json
{
  "schema_version": "1.0",
  "page": { "id": "…", "title": "…", "nav_label": "…", "order": 1 },
  "sections": [
    {
      "id": "…",
      "title": "…",
      "body_markdown_lines": ["Line 1", "", "Line 3"]
    }
  ],
  "crosslinks": {
    "prev": { "page_id": "…", "label": "…" },
    "next": { "page_id": "…", "label": "…" }
  }
}

### Schema Versioning Policy
To ensure backward/forward compatibility, we use semantic versioning for data schemas:
*   **Architectural Map**: `schema_version` (e.g., "2.0"). Bump MAJOR when the core app->content contract changes (e.g., adding a new type of required file).
*   **Page Content**: `schema_version` (e.g., "1.0"). Bump MAJOR if the JSON structure changes incompatibly (e.g., renaming `sections` array).
*   **Rubric**: `schema_version` (e.g., "1.1"). Bump MINOR for weighting tweaks; Bump MAJOR if the scoring *algorithm* changes (e.g., switching from bins to continuous functons).
*   **Rubric Data**: `rubric_version` (e.g. "v1.0.0"). This tracks the *data* (weights/thresholds), not the schema. Update this whenever you change numbers.
Notes:

body_markdown_lines avoids newline escaping; the renderer joins lines with \n.

Keep copy in Australian English.

Do not embed pixel/layout instructions in content.

6) Rubric schema (scoring calculator)

The rubric is the contract between:

the scorecard table (human-readable), and

the calculator (machine-evaluated).

Rubric file must define:

challenge metadata (name, prescription)

a list of metrics with:

structure, statistic, unit

direction (higher_is_better / lower_is_better)

bin thresholds and their labels

weight

optional: category and hard_gate boolean

Safety gates: if hard_gate=true and the value falls in an “unacceptable” bin, the UI should flag it prominently.

7) Adding a new challenge (the safe way)

Copy an existing challenge pack folder to a new <challengeId>.

Update architectural_map.json:

add the new challenge entry under current_challenges

point its file references to the new pack

Update the four page files:

keep the narrative clinically accurate and internally consistent

ensure the planning guide scorecard table matches the rubric thresholds

Update the rubric:

confirm the total weight matches the expected value (e.g. 150)

confirm bins are mutually exclusive and correctly ordered

QA (minimum):

pages load, cross-links are correct

calculator returns a stable score for a known test vector

no PHI appears anywhere in content or stored attempts

8) Editing an existing rubric (rules)

Rubric edits should be rare. When unavoidable:

bump rubric_version

document the reason (clinical safety, correction, or deliberate change in learning focus)

consider backwards compatibility for saved attempts (store rubric version on save)

9) Quality bar for content

Case descriptions must be de-identified.

Literature summaries must be accurate and should not overclaim.

Instructions must be actionable for planners working under time pressure.

The scorecard must reflect clinical plausibility (avoid incentives for unsafe “score chasing”).

10) Test data and fixtures

Maintain at least one scoring “golden case” input vector per challenge pack:

a JSON file of metric inputs

expected per-metric bins and total score

This allows regression testing when the UI or scoring engine changes.
