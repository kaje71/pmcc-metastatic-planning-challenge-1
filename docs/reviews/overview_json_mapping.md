# Overview JSON → UI Mapping

This maps the planned `text/overview.json` schema to Overview page sections.

## Hero / Title block
- `hero.title` → H1 heading
- `hero.lede` → short summary line
- `hero.details` → expanded study context paragraph
- `hero.subtext` → compact supporting line
- `hero.citations[]` → citation tokens rendered in text

## Quick start
- `quickStart.title` → micro-flow headline
- `quickStart.summary` → short orienting paragraph
- `quickStart.steps[]` → 3-step list
- `quickStart.primaryCta|secondaryCta|tertiaryCta` → CTA buttons (tab navigation)

## Critical safety gates
- `criticalSafety.title` → strip header
- `criticalSafety.items[]` → pill list
- `criticalSafety.citationIds[]` → citations

## Evidence snapshot tiles
- `evidenceSnapshot.title` → section header
- `evidenceSnapshot.subtitle` → helper line
- `evidenceSnapshot.keyTileIds[]` → three key tiles shown first
- `evidenceSnapshot.tiles[]` → stat cards
  - `label`, `value`, `unit` → tile content
  - `definition` → tooltip/hover detail
  - `citations[]` → inline citation tokens

## Progressive disclosure blocks
- `disclosure.studyAtGlance` → `<details>` block
- `disclosure.endpointDefinitions` → `<details>` block
- `disclosure.subgroupSensitivity` → `<details>` block

## Palliative spectrum context table
- `spectrumTable.title` → table header
- `spectrumTable.rows[]` → table rows
- `spectrumTable.highlightRegimen` → row highlight
- `spectrumTable.footnote` → single-line footnote
- `spectrumTable.citations[]` → footnote citation tokens

## Why technique matters
- `techniqueMatters.title` → section header
- `techniqueMatters.evidence[]` → bulleted list (evidence statements)
- `techniqueMatters.planningRationale[]` → bulleted list (labelled “Planning rationale”)

## Training goals
- `trainingGoals.title` → section header
- `trainingGoals.items[]` → bulleted list

## Limitations & cautions
- `limitations.title` → section header
- `limitations.items[]` → bulleted list

## OAR constraints (optional disclosure)
- `oarConstraints.title` → disclosure summary
- `oarConstraints.critical[]` → table (critical safety gates)
- `oarConstraints.scored[]` → table (scored OAR constraints)
- `oarConstraints.notes[]` → data ambiguity notes

## References & source documents
- `references[]` → references list (anchor targets for citation links)
- `sourceDocuments[]` → local PDF links

## Rubric changelog
- `rubricChangelog.version` → current version label
- `rubricChangelog.entries[]` → compact changelog list

## Next steps
- `nextSteps.items[]` → CTA strip items
