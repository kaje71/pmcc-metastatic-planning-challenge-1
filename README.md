# PalLung Planning Challenge

A keyboard-first scoring calculator for the 40 Gy/10 fx Palliative Lung Planning Challenge. Internal education tool for Peter Mac radiation therapists and dosimetrists.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## Deployment to SharePoint

1. Build the production bundle:
   ```bash
   npm run build
   ```

2. Upload the `dist/` folder contents to your SharePoint document library or site.

3. Ensure the `index.html` is set as the default page.

> **Note:** This is a fully static site—no backend required. All data is stored in the browser's localStorage.

## Project Structure

```
src/
├── components/          # React components
│   ├── ScoreCalculator.tsx   # Main calculator (dense table layout)
│   ├── views/           # Page components (Overview, History, etc.)
│   └── ui/              # Reusable UI components
├── config/              # Feature flags
├── data/                # Scoring configuration loader
├── engine/              # Scoring logic (pure functions)
├── styles/              # CSS tokens and global styles
├── types/               # TypeScript interfaces
└── utils/               # Utilities (identifier detection)

docs/
├── architectural_map.json    # Scoring matrix and constraints
├── papers/              # Clinical evidence PDFs
└── reviews/             # UI audit documents
```

## Privacy

- **No data leaves your device.** All attempts are stored in browser localStorage only.
- **Patient identifiers are blocked.** The notes field rejects MRN, patient names, and other PHI.
- **No CDNs or analytics.** Fully offline-capable once loaded.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on `localhost:5173` |
| `npm run build` | Production build to `dist/` |
| `npm run test` | Run unit tests |
| `npm run lint` | Run ESLint |

## Clinical Evidence

Constraint values are sourced from `docs/papers/Supplementary-Table-S1.pdf` (40 Gy/10 palliative lung cohort study). Do not modify constraint thresholds without verifying against this document.

## Overview Content Updates

- Overview page content is sourced from `text/overview.json`.
- Update that file to revise the academic narrative, evidence snapshot, tables, and references.
- If hosting PDFs alongside the app, ensure `docs/papers/` is deployed with the site so local links resolve.

## License

Internal Peter Mac use only. Not for redistribution.
