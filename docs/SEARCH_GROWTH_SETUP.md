# Search, attribution and analytics operations

Canonical website: https://569001773-wq.github.io/lyrictap-support/
Sitemap: https://569001773-wq.github.io/lyrictap-support/sitemap.xml

## Verified technical foundations vs indexing

The build emits plain crawlable HTML, self canonicals, reciprocal English/Japanese/Simplified Chinese language clusters, JSON-LD matching visible content, visible breadcrumbs on content pages, raster Open Graph images and a complete sitemap. `llms.txt` is a navigation aid; it is not an indexing requirement or guarantee for Google or AI products. FAQ markup does not imply Google will display an FAQ rich result. SoftwareApplication markup has no invented reviews or ratings; without a real review/rating it may not qualify for Google's app rich result.

`robots.txt` applies only at https://569001773-wq.github.io/robots.txt. A robots file under the project directory does not control crawlers. This repository does not own the account-level robots file. Inspect the real origin response before diagnosing a crawl block. A missing robots file (404) is not a crawl prohibition. An origin robots 5xx requires investigation.

## Google Search Console / Bing Webmaster Tools

These require a signed-in authorized owner. Both showed unauthenticated landing pages during the 2026-10-23 check, so ownership verification, sitemap submission and URL inspection were not completed.

1. Create/select the URL-prefix property for the exact canonical project URL above.
2. Put the actual Google or Bing meta verification token in `site.config.json` (`searchConsoleVerification` or `bingVerification`). The builder injects the public proof tag into the homepage. Do not invent tokens.
3. Deploy, finish verification in the provider dashboard, and submit the sitemap.
4. Inspect the home, `/tools/lrc-maker/`, `/ja/`, `/zh/` and key guides. Record actual index status, last crawl and Google-selected canonical. Sitemap presence or an HTTP 200 is not evidence of inclusion in the index.

## Analytics choice and current status

**Chosen provider: Plausible. Current production setting: disabled; no real account/domain is connected.** There are no measured traffic or conversion numbers from this adapter yet. No paid plan was purchased and no account was created.

The integration uses Plausible's Events API with opt-in consent, no tracking cookies, no arbitrary query strings and no audio/lyric content. It respects Do Not Track and Global Privacy Control. When enabled, users can grant or withdraw consent via the footer preferences dialog. The local consent preference and lyric drafts remain separate.

After connecting a real Plausible account:

1. Add the site's real domain/property to Plausible and configure `analytics.domain` from that account. Keep endpoint `https://plausible.io/api/event`.
2. Set `analytics.enabled: true`. Build updates the website privacy notice to the active consent-based state. Review provider terms and any applicable privacy obligations before activation.
3. Add custom-event goals with the exact names: `Editor used`, `Timeline built`, `Export generated`, `App Store click`.
4. Configure the custom properties `language`, `page`, `format`, `campaign` in Plausible as needed for reporting.
5. Verify real events in the dashboard. A successful HTTP response alone is not proof that the provider recorded the event.

Recorded after consent: canonical page URL, referring **site origin** (not the full path/query), page language, fixed event name, one of LRC/SRT/TXT and an outbound campaign identifier. Plausible derives country from its request processing. User audio, filenames, lyric text, local drafts, accounts and incoming URL queries are not included. Browser language/OS and visit counts may be provider dimensions; the explicit `language` property represents the page language. Support and original app privacy pages are intentionally unchanged and do not include optional analytics.

`Export generated` means a file was generated and handed to the browser. It does not prove the user saved it, installed the app or purchased credits. Consent and blocking mean this is an incomplete, consented sample, not a census.

## Apple App Store attribution

Every marketing download link has a stable language/page/placement campaign identifier. The adapter adds `pt`, `ct` and `mt=8` only when `appleProviderToken` is configured. The token is currently **empty**, so valid App Store destination links remain functional but install attribution is not yet enabled.

Generate one real campaign link in App Store Connect Analytics first; copy its actual provider token (`pt`) into `appleProviderToken`. Apple states that this token cannot be invented. The same provider token is reused across campaigns. Use the page/placement campaign tokens to distinguish the English home, Japanese page, Chinese page, tutorials and post-export CTA. Verify campaigns in App Store Connect; reporting thresholds and delays apply.

Web-to-App-Store click rate = consented App Store click events / consented pageviews for the same page and period. Installs and purchases must come from App Store Connect campaign reports. Do not multiply clicks by an assumed conversion rate or mix consented and total denominators.

## Official references checked 2026-10-23

- https://developer.apple.com/help/app-store-connect-analytics/acquisition/campaign-links
- https://plausible.io/docs/events-api
- https://plausible.io/docs/custom-props/introduction
- https://developers.google.com/search/docs/appearance/structured-data/software-app
- https://developers.google.com/search/docs/appearance/ai-features
- https://help.suno.com/en/articles/13926081
- https://help.udio.com/en/articles/12683565-changes-associated-with-the-universal-music-group-umg-partnership
