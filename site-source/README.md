# Canonical production source

Edit `static/`. Run the build and checks from the repository root as described in `../README.md`.

`npm run build` here calls the same static builder. `npm run check:static` checks `_site/`, so build first. The legacy `scripts/copy-export.mjs` command now copies only the static build to the root compatibility files; it never reads Next.js output. The old Next.js app is archived under `legacy-next/` and excluded from the deployed artifact.
