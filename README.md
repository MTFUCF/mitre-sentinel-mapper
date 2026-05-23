# MITRE Sentinel Mapper

A study-focused bridge between ATT&CK techniques and Sentinel detection thinking.

## What it is

MITRE Sentinel Mapper is a buildless static app that maps ATT&CK techniques to starter KQL examples, caveats, and telemetry context for Microsoft Sentinel and Defender XDR. It is intentionally educational: the examples are reviewable, cautious, and meant to be tuned before any production use.

## What it demonstrates

- Translating ATT&CK techniques into detection engineering starting points
- Search, filter, and deep-link UX in plain HTML, CSS, and vanilla JavaScript
- Clear telemetry context through KQL table names and platform badges
- Recruiter-friendly implementation with no build step and GitHub Pages compatibility

## Live demo

https://mtfucf.github.io/mitre-sentinel-mapper/

## Screenshot

Add a current screenshot to `docs/screenshot.png` when you want the README preview image to match the latest UI.

## Features

- Top search box matching technique ID, name, or KQL content
- Filters for ATT&CK tactic and log source derived from KQL table names
- Technique detail panel with MITRE link, source link, visible citations, caveat, and copyable KQL
- Minimal KQL syntax highlighting for key operators, strings, and table names
- URL hash routing such as `#t=T1059` for direct linking
- Responsive two-pane layout with keyboard-friendly controls and dark mode toggle

## How to run locally

Serve the project from this folder so the JSON dataset can load with `fetch()`. For example:

```bash
cd projects/mitre-sentinel-mapper
python -m http.server 8080
```

Then open `http://localhost:8080/`. If Python is unavailable on your machine, use any equivalent static file server.

## Data source

The app reads from `data/mitre-sentinel-mapping.json`, a human-readable static dataset copied into the project for GitHub Pages-safe hosting.

## Push to GitHub

This project ships as its own standalone repo. To push it to a GitHub account (e.g., a separate cybersecurity-portfolio account), follow these steps.

### 1) Authenticate with the target account

Preferred: use GitHub CLI multi-account auth.

```bash
gh auth login
gh auth switch
gh auth status
```

Per-repo git config keeps commits under the right identity even if your global git config points at another account:

```bash
git config user.name "Matthew Faber"
git config user.email "<your-github-username>@users.noreply.github.com"
```

The noreply email keeps your personal email private. Replace `<your-github-username>` with the target account username.

### 2) Initialize, commit, and push

From the workspace root:

```bash
cd projects/mitre-sentinel-mapper
git init -b main
git config user.name "Matthew Faber"
git config user.email "<your-github-username>@users.noreply.github.com"
git add .
git commit -m "Initial commit"
gh repo create <your-github-username>/mitre-sentinel-mapper --public --source=. --remote=origin --push --description "A study-focused bridge between ATT&CK techniques and Sentinel detection thinking."
```

### 3) Enable GitHub Pages

- Go to repo **Settings → Pages**.
- Under **Build and deployment**, set **Source** to **GitHub Actions** (not **Deploy from a branch**).
- The first push triggers `.github/workflows/deploy-pages.yml`; wait about 30 seconds, then visit `https://<your-github-username>.github.io/mitre-sentinel-mapper/`.

### 4) Updating later

```bash
git add . && git commit -m "Describe the change" && git push
```

## Deploy your own

This repo includes `.github/workflows/deploy-pages.yml` for the modern GitHub-native Pages flow.

1. Push the repo to GitHub.
2. Open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
3. Push to `main` or run the workflow manually with **workflow_dispatch**.
4. After the workflow finishes, open `https://<your-github-username>.github.io/mitre-sentinel-mapper/`.

## Tech stack

- HTML5
- CSS3 with custom properties for theming
- Vanilla JavaScript
- Static JSON dataset
- GitHub Pages

## Project structure

```text
.
├── .github/
│   └── copilot-instructions.md
├── data/
│   └── mitre-sentinel-mapping.json
├── src/
│   └── app.js
├── styles/
│   └── main.css
├── README.md
├── TESTING.md
└── index.html
```

## Notes on scope

- This project is a study aid, not a production detection catalog.
- A technique can map to multiple defensive ideas; examples are intentionally illustrative.
- Treat every KQL block as a starting point that needs tuning, exclusions, and validation in your environment.

## Author

**Matthew Faber**  
Matthew Faber builds hands-on cybersecurity portfolio projects.


