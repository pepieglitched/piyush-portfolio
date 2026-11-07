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
