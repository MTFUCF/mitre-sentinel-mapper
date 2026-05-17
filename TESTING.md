# Manual Testing Guide

Project: **MITRE Sentinel Mapper**  
Baseline date: **2026-05-16**

## P0 — must pass before sharing
- [ ] Run a local static server from `projects/mitre-sentinel-mapper` (for example `python -m http.server 8080`) and confirm `index.html`, `styles/main.css`, `src/app.js`, and `data/mitre-sentinel-mapping.json` all return `200`.
- [ ] The header warning note reads: `⚠️ Examples are illustrative — tune for your environment before production use. See each technique's caveat.`
- [ ] The page shows a searchable technique list on the left and a populated detail panel on the right on desktop widths.
- [ ] The detail panel shows technique ID, name, tactic, MITRE link, source link, visible citations, caveat, and a `Copy KQL` button.
- [ ] The footer credits Matthew Faber and links to `https://github.com/matthewfaber/mitre-sentinel-mapper`.
- [ ] README language makes it clear the KQL is illustrative and not production-ready by default.

## P1 — UX and behavior checks
- [ ] Search for `T1059` and confirm the related technique remains in the list.
- [ ] Search for a KQL phrase such as `powershell -enc` and confirm matching results appear.
- [ ] Filter by tactic and by log source, then confirm the result count updates and the list narrows correctly.
- [ ] Open a direct link such as `#t=T1059` and confirm the matching technique detail opens automatically.
- [ ] Toggle dark mode and refresh the page to confirm the chosen theme persists.
- [ ] Activate `Copy KQL` in a secure browser context and confirm the clipboard receives the visible query.
- [ ] Keyboard-tab through search, filters, technique buttons, and links to confirm visible focus states.

## P2 — responsive and content checks
- [ ] Confirm the layout remains readable at approximately 320px, 768px, and 1440px widths.
- [ ] Verify the KQL block highlights keywords, strings, and table names distinctly enough in both themes.
- [ ] Confirm `Where this runs` badges reflect table-derived platform context.
- [ ] Review a few mappings to ensure caveats and citations remain visible without extra clicks.
- [ ] Confirm there is still no build step or root-level package tooling required to run the app.
