# Portfolio Iteration V3 progress

V3 is implemented in the existing Next.js checkout. The final export passed the production build, TypeScript, ESLint, 23 integration checks, and six lifecycle checks. [Verification and reports](docs/VERIFICATION.md).

## Resumed audit

The existing project already had six case studies, a spatial mind scene, Signal Run, and the paper, ink, and red editorial design. The interrupted V3 pass had partial navigation handlers, portrait renderer code, an alpha matte, and academic chapter components. The outstanding work was integration, visual refinement, accurate asset output, cinematic motion, and end-to-end verification.

## Completed

- The sticky floating glass navigation uses the name wordmark, six chapter anchors, CSS reflections, a magnetic contact button, and a Motion mobile disclosure. The red asterisk and compact hero education labels were removed.
- The original hero photograph was joined to a one-channel matte without changing its RGB pixels. Four responsive AVIF variants retain alpha. The canvas reuses the decoded portrait, follows its silhouette, and settles without an idle frame loop. Tap, keyboard, and reduced-motion modes are available.
- The Education timeline and Page 5 Skill Set use the uploaded Education and Technical Skills document. Page 7 uses the supplied second sunglasses portrait. The game continues to Skills, with space reserved before its lazy load.
- Nine scoped GSAP chapter drivers cover masked words, wipes, parallax, and one desktop Education pin. A ref gate fixes cached route remounts. Skills callbacks stay inside their own matchMedia context to avoid recursive GSAP cleanup. Lenis shares the GSAP ticker and honors the CSS anchor padding. Coarse pointers and reduced motion use native scroll.
- Six plain-text resources regenerate from the content module. Metadata, sitemap, robots, social preview, case studies, game, and spatial fallback were verified.

## Content and testing limits

- Leave the conflicting Class 12 percentage, unconfirmed official school and programme wording, and unknown board and academic dates out until Piyush confirms them. React is learning, C and C++ are academic exposure, and unfinished hardware is experimentation. See `docs/V3-CONTENT-AUDIT.md`.
- The final Lighthouse desktop score is 100. Mobile performance is 79, with LCP 3.39 seconds and CLS 0. Mobile accessibility and SEO are 100. Field INP, physical devices, Safari, Firefox, and a manual screen reader pass remain unmeasured.

## Reproduce or resume

1. Dependencies are already installed in this checkout. Run `npm.cmd run build` and `npm.cmd run preview` from the project directory.
2. Run `node scripts/verify-lifecycle.mjs` and `node scripts/verify.mjs` against the static preview. Keep the preview isolated during Lighthouse.
3. The existing owner-private Site is `appgprj_6aedd2285d0c8191aacca5c44d46a083`. Its original version used commit `988c0df8d83c902cefae86d609368e95851fdeff`. Reuse the existing Site and verify the current version and audience with Sites before any further release. Deployment URL is https://piyush-builders-mind.plaidchime4.chatgpt.site.
4. For a separate Vercel deployment, follow [README.md](README.md), set the real site origin, and build to `out/`.

The original source archive remains in outputs. The V3 source archive is a separate deliverable.

# Portfolio Iteration V4

## Stage 1 — audited

- Opened the existing owner-private Site checkout at V3 commit 242ea62. Preserving the editorial identity, chapter structure, original hero, game, and project pages.
- Reviewed the 12-second animation reference. It uses stepped typography, thin technical guides, and reveals that run in layers. V4 adapts these on paper and ink.
- Brainwiz and LaserHacks have matching PDFs. The third supplied PDF is a separate course completion. OlympAI and Smart India Hackathon previews remain inactive until matching evidence is supplied.
- Identified a stale WebP portrait URL in the home JSON-LD. V4 will use the existing alpha AVIF.
- Next: migrate scroll ownership to Locomotive, refine the glass nav, implement two real certificate previews and the LaserHacks correction, tune the hero and chapter motion, and add the portrait and skill marks.

## Stage 2 — implemented

- The existing glass nav gained greater translucency and direction-aware GSAP motion. One Locomotive Scroll instance moves the native window and updates ScrollTrigger on the shared ticker. Touch and reduced motion retain native scrolling.
- Evidence keeps four rows. Brainwiz and LaserHacks have matching, optimized previews, accessible dialogs, and keyboard and touch support. The other two rows have no preview control. LaserHacks now says Finalist — Top 7 Teams.
- The original hero sits higher and fits a shorter laptop composition. The new portrait is a closing portrait stamp with a masked GSAP reveal and AVIF variants.
- Skill rows keep their original names and show verified brand SVGs or neutral marks. No experience data was added.
- The video inspired layered hero guides, line draws, a stronger Signal Run entrance, project guide marks, and staggered academic and skill animations.
- Next: validate production, correct any layout or interaction regressions, measure Lighthouse, and update the same private Site.


## Stage 3 — verified

- Production build, lint, and TypeScript passed. The 29 integration and seven lifecycle checks passed with zero runtime errors. Four axe scans found zero violations.
- Lighthouse performance scored 94 on mobile and 100 on desktop. Mobile LCP measured 2.97 seconds. See docs/VERIFICATION.md and docs/reports/v4 for all metrics.
- Brainwiz and LaserHacks are active. OlympAI and Smart India Hackathon remain inactive pending matching assets.
- The existing owner-private Site is the V4 release target. For release provenance or later updates, reuse the existing Site ID and query the current live version. Do not run a second scroll engine beside Locomotive.

# Portfolio Iteration V5

- Resumed from the existing V4 checkout and in-progress V5 styles and displacement component. Wired the dedicated glass layer and filter into the existing navbar.
- The optical layer uses light tint, a softly lit rim, and adaptive blur. Desktop Chromium can sample a curved SVG displacement map. Other browsers and touch sizes use the SCSS bevel and native blur.
- Existing layout, anchor indicators, sticky header motion, and Locomotive integration remain in place. Reflection updates only on pointer events. The displacement map rebuilds only when the navbar geometry changes.
- Next: validate the production export, compare the rendered rim over light, dark, and textured backgrounds, and verify mobile navigation, reduced motion, and keyboard focus.

## V5 verified

- The transparent surface, curved edge refraction, pointer reflection, navigation highlights, and raised contact control are implemented. On desktop Chrome and Edge, rendered pixels bent near the rounded rim while the center stayed aligned. The optical layer does not intercept input.
- Chrome, Edge, and the 390px touch layout passed light, dark, and textured background checks. Sampled foreground contrast met 4.5:1 across the tested labels and surfaces. The mobile menu, anchors, active indicators, scroll direction, keyboard focus, and reduced motion passed.
- The production build, TypeScript compilation, lint, 29 integration checks, and seven lifecycle checks passed. Four axe scans reported zero violations.
- Firefox and Safari use the SCSS fallback and were unavailable for direct testing. The CSS fallback was exercised on Chromium without the SVG layer and at touch sizes.
- V5 is packaged from this checkout for the same owner-private Site. No app changes are pending. Reuse the existing Site ID and check its current live version before the next release.

# Portfolio Iteration V6

## Audit and integration

- Started from V5 commit 4582557 and reviewed JarnKet's graphite, blue, and fine-grid visual language as inspiration for a separate Cyber palette.
- Optimized the supplied transparent controller sticker as a WebP and kept it out of the initial page load.
- Integrated the verified LinkedIn Learning course, Leadership through Feedback, as a separate Continuing Learning record. Added keyboard, touch, and row-hover previews through the existing certificate system. The image derivatives omit the certificate identifier, and `/llms-full.txt` uses the same course record as the page.
- The Viksit Bharat Buildathon PDF contains media collateral. Neither supplied PDF verifies OlympAI or Smart India Hackathon, so those two previews remain inactive. The four competition records and LaserHacks finalist status are preserved.
- Moved Signal Run into the standalone route. The home page imports only the discovery control. The new route is in the sitemap and text edition.
- Replaced competing horizontal project title transforms with a vertical reveal on the copy inside a shared grid. The number, status, and arrow columns stay in place.
- Added a nonblocking boot rail for full home loads. It responds to portrait and font readiness with a bounded escape, and the page paints throughout.

## V6 verified

- `npm.cmd run build` generated 13 static pages. ESLint, standalone TypeScript, and `git diff --check` passed.
- The 30 integration checks and seven lifecycle checks passed. Chrome and Edge verified navigation, Locomotive Scroll and GSAP lifecycle, keyboard focus, reduced motion, WebGL fallback, and responsive layouts. Automated axe scans found zero violations across five Editorial and four Cyber views.
- Full portrait conversion covers the actual silhouette and restores the halftone on pointer exit. Touch and keyboard controls work, and reduced motion shows a static conversion. Measured laptop, tablet, and desktop layouts keep the enlarged portrait clear of the navbar.
- The controller invitation supports desktop and touch, restores focus and scroll on dismissal, and opens the standalone Signal Run route. Verified both arcade and turn-based play, return links, canonical metadata, sitemap, and public text resources.
- Editorial remains the default. The Cyber choice restores before hydration and persists on reload. Theme and mobile menu controls fit at 320px and 390px. Verified stable project column alignment on scroll and client navigation, and limited the boot rail to full loads.
- Disabled automatic project route prefetch after reproducing invalid RSC prefetch requests in the Windows static export. Client navigation still works, and no browser errors remained in the tested routes.
- Local Lighthouse accessibility and SEO scored 100 on all four runs. Desktop performance scored 100 with FCP 0.32 s, LCP 0.62 s, and CLS 0.010. Three mobile runs scored 75–88 with FCP 1.09–1.13 s, LCP 2.72–3.20 s, and CLS 0–0.008. Mobile LCP and performance remain outside the targets. The hero portrait was the LCP element and was requested eagerly with high priority. Field INP, Safari, Firefox, physical devices, and manual screen-reader behavior were unmeasured.
- Release target: the existing owner-private Site. Preserve its access policy. Only add the two remaining competition previews when matching evidence is supplied.

# Portfolio Iteration V7

## Stage 1 — audit

- Resumed from clean V6 commit `34b2f67`. The homepage portrait, scroll animation, theme controls, certificate rows, and controller invitation are already in place.
- The screenshots identify the light-polo portrait in the contact chapter and the original Canvas robot and Error Bot sprites. Retain those assets. The reference game informs the score layout and arcade presentation.
- The existing Site had a static Next.js export and no database. The production build retains the static pages and adds a separate Worker for the leaderboard with a managed D1 binding. Keep the Site owner-private.

## Stages 2–3 — runner and leaderboard

- Added a shared fixed-step runner model with seeded obstacle spacing, progressively increasing pace, separate Error Bot and pit endings, and server-replayable jump ticks. The server calculates the final score from time, distance, and cleared hazards.
- Added the D1 schema and same-origin leaderboard API. Ranked attempts have signed, expiring run tokens and validate input, actor, elapsed time, and the complete replay. The database rate-limits writes and makes retries idempotent. Four local SQLite tests passed for these safeguards, concurrency, persistence, and ordered top ten.
- Added a Worker build alongside the Next export and a separate local preview database. Hosted D1 and signing secret must be verified during deployment.

## Stages 4–6 — homepage interactions and glass

- Made PLAYER_01 a keyboard- and touch-operable entry to the existing shared invitation. The controller discovery remains independent, and focus returns to the trigger that opened the dialog.
- Connected the original closing portrait to a lazy GSAP pill choice with photo zoom, backdrop dimming, native Escape, and reduced-motion support. Red opens Signal Run. Blue gives the requested feedback and returns to the original scroll position.
- Reduced the navbar's background tint and optical bloom in both themes. Chrome and Edge verified edge-only displacement, backdrop transmission, and sampled label contrast above 4.5:1. Touch used the CSS fallback. Scroll direction, active section, anchors, keyboard access, and placement were verified.

## Stage 7 — production verification

- `npm.cmd run build`, ESLint, TypeScript, and `git diff --check` passed. The build generated 13 static Next.js pages and a separate Worker artifact with the D1 migrations.
- Passed 32 integration checks, seven lifecycle checks, and four leaderboard database tests. Five integration axe scans plus the score dialog scan found zero violations. Chrome and Edge covered keyboard and mobile-emulated touch, both game-over paths, restart, reduced motion, theme controls, navigation, and existing content.
- The browser submitted a real local ranked replay. The server calculated the same score, returned the new rank, and showed it again on reload. Invalid usernames were rejected, and the production database is separate from the local verification database.
- Step practice remains available as an unranked accessibility option. Play is endless. Ranked replays are capped at 30 minutes to bound server verification. The basic replay and duration checks cannot detect automation that produces a valid run.
- The hidden controller still loads on discovery, and its shared dialog preserves focus, scroll, and navigation. No gameplay or leaderboard request was made from the unopened homepage.
- Local mobile Lighthouse against the production preview scored 80 for the home page and 89 for `/play/`, with accessibility and SEO at 100 on both. LCP was 4.58 s on home and 0.91 s on `/play/`, and CLS was 0.009 and 0.001. These local lab runs do not measure field INP or live network performance.
- The hosted signing key is configured through the existing Site's secret store. Keep the existing owner-private access policy. The production leaderboard starts with no seeded entries.
