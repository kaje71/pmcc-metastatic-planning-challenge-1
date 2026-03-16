# Release Notes - UI Overhaul (v0.1.0)

**Date**: 2026-01-20
**Version**: 0.1.0 (Phase 3-6 verified completion)

## Overview
This release transforms the PalLung Planning Challenge tool from a mobile-first prototype into a **desktop-first clinical education instrument** aligned with the Peter Mac brand.

## Key Changes

### 1. Navigation & Layout
- **New Top Tab Bar**: Replaces hamburger menu on desktop viewports.
  - *Tabs*: Overview, Planning Brief, Calculator, History.
  - *Leaderboard*: Hidden by default (Feature Flag: `disabled`).
- **Wider Container**: Main view width increased to `max-w-7xl` to accommodate dense data tables.
- **Safety Badge**: "Educational tool only" indicator permanently visible in header.

### 2. Calculator (High-Density)
- **Table Layout**: Replaced card stacks with a clinical data table grouped by organ (PTV, Cord, Lung, Heart).
- **Sticky Summary**: Score summary rail stays visible while scrolling.
- **Live Feedback**:
  - Constraint limits displayed inline (e.g., `≤ 30.9 Gy`).
  - Cross-field validation (e.g., Physical monotonicity checks on Lung V4.5 vs V16).
- **Keyboard Support**: `Ctrl+S` / `Cmd+S` shortcut to save attempts.

### 3. History & Analytics
- **Trend Visualization**: Added SVG sparkline chart showing score trajectory.
- **Comparison Tool**: Select any two attempts to view side-by-side metric deltas.
- **Data Export**: CSV and JSON export options for offline analysis.
- **Personal Best**: Highlighting for highest-scoring attempts.

### 4. Visuals
- **Peter Mac Branding**: Standardized on Light Theme using `pmac-800` (purple) and `pmac-accent` colors.
- **Removal of Legacy Styles**: Eliminated "Slate 950" dark mode remnants.

## Operational Notes

### Privacy
- **Local Storage Only**: No data is sent to any server.
- **PHI Blocking**: Attempts to save notes containing MRNs or Patient IDs are blocked.

### Deployment
- **Static Bundle**: Deploy `dist/` folder to SharePoint.
- **Assets**: All fonts and assets are embedded/relative; no external CDN dependencies.

## Known Limitations
- **Heart Dmean**: Currently "Reporting Only" (score weight 0) pending clinical adjudication on tiering.
- **Mobile View**: Functional but optimized for desktop; calculator table may require horizontal scroll on very small phones.
