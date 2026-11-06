# Verification report — 6 November 2026

The exported production build was served at `http://localhost:3000`. These are local lab results, not field Core Web Vitals or a guarantee for every device and network.

## Build and source checks

- Next.js 16.4.5 production export: passed, including all six project routes, project archive, robots, and sitemap.
- TypeScript: passed (`npm run typecheck` and Next production type verification).
- ESLint: passed (`npm run lint`).
- npm dependency audit: zero vulnerabilities after compatible dependency updates and scoped overrides, including development tools. Production-only audit also reports zero.
- JSON-LD parses on all six project pages. Identity, project statuses, and achievement wording were checked against the dossier. Google Rich Results testing was not run.
- All required Markdown/text resources, social preview, robots, sitemap, and project routes return HTTP 200.

## Lighthouse

| Metric | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 88 | 96 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| First Contentful Paint | 1.2 s | 0.5 s |
| Largest Contentful Paint | 3.1 s | 0.8 s |
| Total Blocking Time | 280 ms | 150 ms |
| Cumulative Layout Shift | 0 | 0.01 |

The mobile 90+ performance goal and 2.5-second LCP target remain unmet in this lab run. Mobile FCP and CLS meet the requested targets. TBT is a lab responsiveness measure; it is not INP. Field INP and real-user LCP are not available before public traffic.

Full reports: [mobile](reports/lighthouse-mobile.html), [desktop](reports/lighthouse-desktop.html).

## Browser and interaction verification

The integration suite passed 15 checks. Axe WCAG 2 A/AA and 2.1 AA scans found zero violations on the desktop home, paused-game, and mobile views. No browser runtime errors occurred.

- Responsive overflow checks: 360, 390, 768, 1024, 1440, and 1920 pixels.
- Mind and laboratory tabs: keyboard selection, focus, and labelled panels.
- Signal Run: all three cores collected in turn-based mode; keyboard movement and Escape pause; Skip navigation.
- Mobile menu: actual target alignment below the sticky header, not only the URL hash.
- Actual touch input: first hold moves the robot, release stops it, and overlay stays inside the 400px mobile stage.
- Primary biography and project content remain in server HTML and readable through native navigation without JavaScript.
- Reduced motion preserves content, reverts owned transforms, and removes Lenis scrolling.
- WebGL unavailable: static orbital diagram, text, tabs, and Canvas 2D game remain usable.
- Three Next client route cycles retain stable native/global/media listener counts and stable home animation targets.
- Installed Chrome and Microsoft Edge render the home and case-study routes.

The separate lifecycle suite passed 5 checks. Direct private ScrollTrigger and ticker callback counts are not exposed by the production ESM bundle; observable listener registrations, animation targets, and transform reversion were verified instead. Source cleanup was also reviewed.

Machine-readable evidence: [integration](reports/integration.json), [lifecycle](reports/lifecycle.json).

## Verification limits and missing assets

- No physical iPhone/Android device, Firefox, Safari, screen reader, or long-duration GPU soak test was available.
- Local audits do not measure deployed network latency or field INP.
- No email, verified per-project repository/demo URLs, authentic project screenshots, prototype photographs, or certificate image files were supplied. Project visuals are labelled original explanatory artwork. Missing details are recorded in CONTENT-AUDIT.md.
- The Sites preview is owner-private. For a public Vercel deployment, set `NEXT_PUBLIC_SITE_URL` to the public domain before building so canonical, sitemap, Open Graph, and JSON-LD URLs match it.
