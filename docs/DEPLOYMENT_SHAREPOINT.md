# SharePoint Deployment Guide

## Quick Start

```bash
# 1. Build the production bundle
npm run build

# 2. Upload the contents of `dist/` folder to SharePoint
```

---

## Pre-Deployment Checklist

| Item | Status | Notes |
|------|--------|-------|
| No external CDN calls | ✅ | All assets bundled locally |
| Inter font bundled | ✅ | `assets/fonts/Inter-Variable.woff2` |
| Relative paths | ✅ | Vite `base: './'` configured |
| Hashed filenames | ✅ | Cache-busting enabled |
| No network requests | ✅ | 100% offline-capable |
| No cookies/tracking | ✅ | Privacy compliant |

---

## Build Output

After running `npm run build`, the `dist/` folder contains:

```
dist/
├── index.html              (~0.5 KB)
├── assets/
│   ├── index-*.js          (~292 KB → 91 KB gzipped)
│   ├── index-*.css         (~58 KB → 11 KB gzipped)
│   └── Inter-Variable-*.woff2  (~22 KB)
```

**Total Bundle Size:** ~372 KB (~124 KB gzipped)

---

## SharePoint Upload Steps

### Option A: Document Library (Recommended)

1. Create a new folder in SharePoint Document Library
2. Upload all files from `dist/` (preserving folder structure)
3. Navigate to the `index.html` file and share the link

### Option B: SharePoint Pages (If Available)

1. Use the "Embed" web part if your SharePoint allows iframe embedding
2. Point to the deployed `index.html`

---

## Configuration Notes

### Vite Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  base: './',  // ← Critical for SharePoint relative paths
  // ...
})
```

### Why Relative Paths Matter

SharePoint URLs often include document library paths like:
```
/sites/TeamSite/Shared Documents/PalLung/index.html
```

Using absolute paths (`/assets/...`) would break. Relative paths (`./assets/...`) work correctly.

---

## Troubleshooting

### Problem: Blank page after upload

**Cause:** SharePoint may block JavaScript execution in some configurations.

**Solution:** 
1. Check SharePoint admin settings for script execution policies
2. Try uploading to a different document library with script enabled

### Problem: Fonts not loading

**Cause:** Font file path incorrect or file not uploaded.

**Solution:**
1. Verify `assets/` folder was uploaded with all files
2. Check browser Network tab for 404 errors

### Problem: Old version still showing

**Cause:** Browser caching.

**Solution:** 
1. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Hashed filenames should force cache invalidation on new deployments

---

## Security & Privacy

- ✅ **No external network calls** — Works completely offline
- ✅ **No data leaves the browser** — All data in localStorage
- ✅ **No patient data stored** — PHI detection blocks identifiers
- ✅ **No analytics/tracking** — No cookies or beacons

---

## Version Info

- **Rubric Version:** 0.2-evidence-aligned
- **Build Date:** Check `dist/assets/` filenames for build hash
- **Source:** See `package.json` for version
