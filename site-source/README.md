# LyricTap GitHub Pages source

The original Lyrics Studio is exported as static HTML, CSS and JavaScript with Next.js. Audio selection, playback, manual lyric timing and LRC/SRT/TXT export stay in the browser.

Live website: https://569001773-wq.github.io/lyrictap-support/

## Update the website

Use Node.js 22 or later. From this directory, run:

```sh
npm ci
npm run build
node scripts/copy-export.mjs
```

Commit `site-source/` and the updated exported files in the repository root to `main`. The existing GitHub Pages branch deployment publishes them. The copy script preserves existing privacy/support pages, their stylesheet and favicon, and the existing 404 page.

`next.config.ts` sets `output: "export"`, `basePath: "/lyrictap-support"` and trailing slashes. The page's canonical URL and structured data use the GitHub Pages URL. No server, ChatGPT login, API key, database, or Cloudflare service is required.

Migration source: Sites project `appgprj_6a89b1d0dab08191b226e8206aca67d6`, commit `c2ae866ed2ac3a48f4a3ae2506791e4dd5e11299`.
