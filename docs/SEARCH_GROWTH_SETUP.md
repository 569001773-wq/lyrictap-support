# LyricTap search and deployment checklist

This repository is a GitHub Pages project site at https://569001773-wq.github.io/lyrictap-support/.

## Published automatically in GitHub Pages
- HTML pages with canonical URL, local language, descriptions, schema.org WebPage/Article and internal links.
- Sitemap with canonical pages and their last modification dates.
- Language landing pages in /ja/ and /zh/, English root, and long-tail search guides.
- The browser studio works without API keys or server calls; no audio is uploaded. Text/timestamps are saved locally, audio is not.

## Steps that require account ownership
- Google Search Console: create URL-prefix property https://569001773-wq.github.io/lyrictap-support/ ; verify ownership with Google's provided token (do NOT invent token); submit sitemap URL https://569001773-wq.github.io/lyrictap-support/sitemap.xml ; check real index status.
- Bing Webmaster Tools: add the same URL-prefix, verify, submit the sitemap.
- Connect a privacy-conscious analytics account and review any applicable consent obligations before injecting tracking scripts. No real analytics account ID is available.
- Add real app screenshots, real demo video, and a raster social sharing thumbnail when originals are supplied.
- No truthful search volume or conversion metrics exist until Search Console / analytics collect data.

## robots.txt
robots.txt is scoped to the origin root https://569001773-wq.github.io/robots.txt, not the /lyrictap-support/ directory. The project repository cannot control the account-level robots.txt. No subpath robots file is claimed to work.

## Rebuilding future changes
The original Next.js site is kept for reference. The actual SEO-first static homepage and guides are in site-source/static/; after Next build, node site-source/scripts/copy-export.mjs copies the static site last. Commit source and published root files together. Legal/support pages remain unmodified.

## Guarantees not made
Indexation, ranking, AI citations, traffic and App Store purchases are not guaranteed. No fake product ratings, Search Console verification tokens, original iOS screenshots or real demo videos are presented. Optional iOS AI processing and lyric video export are separate from the free browser editor.
