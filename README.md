# LyricTap website

Production: https://569001773-wq.github.io/lyrictap-support/

All production pages, legal/support pages and browser assets have a **single source of truth: `site-source/static/`**. Edit there. The old Next.js implementation lives in `site-source/legacy-next/` for reference and is never built or deployed.

## Build and verify

Node 22+, from the repository root:

```sh
npm ci
npm run build
npm run check:static
npm run test:unit
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

`npm run build` produces only `_site/`, from the static source. It never copies a Next.js export and cannot overwrite source pages. `cd site-source && npm run build` invokes the same build. `npm run sync:root` refreshes the branch-root compatibility copy, if needed; do not edit generated root HTML or JavaScript.

Pull requests and `codex/**` branches run all checks without deploying. Main deploys `_site/` using GitHub Pages **only after** static checks, format tests and the desktop Chromium / iPhone WebKit / iPad WebKit suites pass. The workflow then runs the same browser suite against production. Evidence is retained in Actions artifacts for 14 days. The workflow migrates the existing Pages source to GitHub Actions during its first successful deployment.

`LIVE_BASE_URL=https://569001773-wq.github.io npm run test:e2e` tests production. `LOCAL_MOBILE=1 npm run test:e2e` is a Chromium mobile viewport fallback for environments without WebKit system libraries; it does not represent real Safari hardware testing.

## Maintenance

- Preserve canonical URLs, language clusters and original legal/support addresses. `check:static` validates all source pages, sitemap coverage, reciprocal hreflang, JSON-LD, resources and local fragments.
- `formats.js` is shared by the browser and pure format tests; the editor contains no network API. Analytics lives in a separate adapter with an explicit property allowlist and consent gate.
- App Store images are authentic published assets. Their source URLs and retrieval date are recorded in `site-source/static/assets/sources.json`.
- The 1200×630 PNG social card is a brand image, not a fabricated app screenshot.
- Keep external product claims dated and sourced. In particular, do not promise current Udio downloads.
- To roll back: revert the problematic source commit on main. CI tests the revert before publishing. Do not reset or force-push main.

Read [docs/SEARCH_GROWTH_SETUP.md](docs/SEARCH_GROWTH_SETUP.md) for account-dependent indexing, analytics and Apple attribution setup. No verification, indexing or conversion results are implied by the presence of configuration files.
