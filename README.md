# 36 Weeks — offline training PWA

Static site (no build step). Files: index.html, style.css, plan.js (your roadmap + exercises), figures.js (animated demos), core.js, report.js, app.js, sw.js, manifest.webmanifest, icons/.

## Publish on GitHub Pages
1. Create a repo, add all files at the repo root, push to `main`.
2. Repo → Settings → Pages → Deploy from a branch → `main` / `(root)`.
3. Open `https://<user>.github.io/<repo>/` in Safari on the iPhone, wait for it to load once, then Share → Add to Home Screen.

Note: on GitHub Free, Pages needs a *public* repo. Private repo + Pages needs a paid plan. Alternatives that work with a private source: Cloudflare Pages (connect the private repo) or Netlify.

## Updating
Edit files, then bump `CACHE = 'wk36-v1'` in sw.js (e.g. `wk36-v2`) so phones refresh their offline copy. Progress lives in the phone's localStorage and is untouched by updates.

## Data
All logs are stored on the phone only. Report tab → Export backup regularly. Deleting the home-screen icon deletes the data.
