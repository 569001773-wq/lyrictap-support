# LyricTap GitHub Pages

The primary website is a static, SEO-friendly landing page with a free in-browser manual lyrics editor and original guides. Website: https://569001773-wq.github.io/lyrictap-support/

## Source of truth
- `site-source/static/index.html`: canonical static landing/editor markup.
- `site-source/static/studio.js`: browser-only music timing engine. No audio upload.
- `site-source/static/growth.css` and `growth-pages.css`: site styles.
- `site-source/static/guides/`, `tools/`, `ja/`, `zh/`: static content pages.
- `site-source/static/sitemap.xml` and `llms.txt`.
- `privacy/`, `support/`, and en/ja legal/support pages: preserved root-site assets.

## Update and publish
The old Next.js source remains for historical reference. Its output is **overridden** by the files in `site-source/static/` when you run:
```sh
cd site-source
npm ci
npm run build
node scripts/copy-export.mjs
```
Commit both the canonical files in `site-source/static/` and generated root pages to `main`, because GitHub Pages serves the root branch output.

The free editor supports drag/drop, local resume of lyric timestamps (audio is not persisted), line timing, increasing timestamp validation, LRC/SRT/TXT exports and mobile tap controls. Automated time alignment and MP4 generation remain iOS-only features.

Read `docs/SEARCH_GROWTH_SETUP.md` for Search Console/Bing and indexing verification.
