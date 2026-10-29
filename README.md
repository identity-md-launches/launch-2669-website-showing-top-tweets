# The Pond

A dark-green, AI Pepe-themed website for finding top tweets about Identity MD. Includes 11 real, sourced tweets; search; topic/date filters; four ranking modes; original X permalinks; and bookmarks saved in the current browser.

The completed static site is **`dist/index.html`** and its adjacent assets. Source, `package.json`, and `package-lock.json` are included. No backend, wallet, account, API key, or runtime data service is required.

## Install, run, and rebuild

Use Node **22.12 or newer** and npm. Node 24.21.0 / npm 11.19.0 were used for the recorded checks.

```sh
npm ci
npm run dev
```

Vite prints its local development URL, normally `http://localhost:5173`.

```sh
npm run typecheck
npm run build
npm run preview
```

Preview normally uses `http://localhost:4173`. `build` also runs the TypeScript check, then regenerates the **entire `dist/` export**. Serve the contents of `dist/` on any ordinary static host. Vite's `base: './'`, local fonts/images, and hash navigation support gateway subpaths without server rewrites. Keep `dist/` in the submission; there is no deployment step in this assignment.

To inspect the included export without installing dependencies:

```sh
python3 -m http.server 8080 --directory dist
```

Open `http://localhost:8080`. A local HTTP server is recommended over opening the file URL directly because the export uses JavaScript modules.

## Data and behavior

`src/data/tweets.json` is a selected snapshot captured **29 October 2026 at 18:09:17 UTC**. Public tweet metadata was retrieved through the public FxTwitter API; every card retains the original `x.com/.../status/...` URL. Full provenance and recorded counts are in [artifacts/sources.md](artifacts/sources.md).

“Top” means most recorded likes **within these 11 selected tweets**, not a complete index of X. Most reposted, most viewed, and newest-first ordering use the same real snapshot. Quotes are short verbatim excerpts; the muted copy is an editorial summary. The visible snapshot label opens an About dialog explaining these limits. Counts do not update in the browser.

Bookmarks use `localStorage` under `the-pond:saved-tweets:v1`; they stay on this browser/device and are separate from X. If storage is blocked, the UI explicitly reports that saves last only for the visit. Copy link uses the Clipboard API; if unavailable, a dialog exposes the real selectable URL. External links to X may require login or internet access.

To update the collection, verify each original tweet, edit `src/data/tweets.json`, update `capturedAt` and its recorded metrics, and bundle any new author avatars in `public/images/`. Preserve accurate attribution, short quotations and the original status URL. The date selector in `src/App.tsx` currently covers September and October 2026; update its month options if adding another month. Update scenario expectations if changing the collection, then rebuild and validate. This update is deliberately an editorial operation, not an automated scraper.

## Validation

The final production build and standalone typecheck passed. The browser scenario script passed **18 scenarios** against the actual `dist/` served under `/preview/`. The pinned **taste@1 probe passed all 16 checks**. Automated axe scans reported zero violations in the desktop feed, 390px mobile feed, and About dialog. These are worker-side results, not independent certification.

```sh
npx playwright install chromium webkit
npm run validate
```

For restricted machines, install browser binaries inside the disposable scratch directory:

```sh
PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers npx playwright install chromium webkit
PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers npm run validate
```

The script owns its preview server and closes it on completion. It records fresh results/screenshots in `test/scratch/validation/`, which is excluded from delivery. The Playwright browser package is a development dependency; no browser binaries or dependency caches are shipped. On this machine the pinned probe was run with:

```sh
PLAYWRIGHT_BROWSERS_PATH=test/scratch/browsers node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste
```

The pinned `.imd/reads` inputs are assignment materials, not a delivered dependency. The reusable `npm run validate` script remains in the submission.

Checked: ordering, combined filters and reset, saved/empty states, hash routes and reload persistence, actual clipboard content, manual-copy and blocked-storage recovery, original tweet link/new-tab behavior, keyboard paths and dialog focus, 13 viewport widths, root text enlargement, forced colors, reduced motion, measured solid color contrast, external-service independence, and console/resource failures.

**Limitations:** WebKit was installed but could not launch because this host lacks required GTK/GStreamer and related libraries; Safari behavior is unverified. The supplied remote browser tool could not reach the shell preview; local Playwright Chromium was used for the rendered checks and screenshots. Native browser zoom, physical devices, screen-reader sessions, and 10%-speed animation-panel inspection were not performed. No full accessibility or universal browser-compatibility claim is made. The automated checks do not certify the truth of external authors' claims or future availability of X links.

See [artifacts/validation.md](artifacts/validation.md) for six-domain coverage, findings/fixes, actual measurements and completion limits, [DESIGN.md](DESIGN.md) for the implemented system, and [artifacts/screenshots](artifacts/screenshots) for retained rendered evidence.

## Files and licenses

- `src/`: React/TypeScript implementation and sourced tweet snapshot.
- `public/`: locally bundled runtime art, avatars, font, favicon, share card and license notices.
- `dist/`: complete production export, included with the source.
- `scripts/validate.mjs`: repeatable browser interaction checks against the export.
- `artifacts/`: design review, sources, measured results, screenshots and explicit submission path budget.

The Pepe artwork was generated for this build. Public author avatars and tweet excerpts are attributed to their original authors; no endorsement is implied. DM Sans is SIL OFL, React/React DOM are MIT, and Lucide is ISC; their notices are bundled locally. The supplied design guidance licenses are retained in `artifacts/licenses/`. See [artifacts/NOTICE.md](artifacts/NOTICE.md).

Generated dependencies, nested caches, test outputs and browser binaries are excluded by `.gitignore`; its explicit allowed-path budget is [artifacts/path-budget.md](artifacts/path-budget.md). The delivered export, source and runtime assets remain complete within the 8 MiB assignment limit. Actual delivered byte totals are recorded in `artifacts/size-report.json`.
