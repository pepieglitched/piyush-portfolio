# Portfolio Iteration V4 verification — 7 November 2026

Next.js exported the production pages to out. The production build, TypeScript, and ESLint passed. Lighthouse used standard mobile and desktop presets against the exported site served locally.

| Lighthouse 13.6 | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 94 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| First Contentful Paint | 1.07 s | 0.31 s |
| Largest Contentful Paint | 2.97 s | 0.72 s |
| Total Blocking Time | 130 ms | 12 ms |
| Cumulative Layout Shift | 0.007 | 0.009 |

The final mobile performance score was 94. Mobile LCP was 2.97 seconds. LCP remains above the 2.5-second target. The mobile run fetched hero-transparent-640.avif (54.7 KiB). Total Blocking Time is a lab measure. Field INP and deployed network performance were unavailable.

[Mobile report](reports/v4/lighthouse-mobile.html) · [Desktop report](reports/v4/lighthouse-desktop.html)

## Browser verification

- The integration suite passed 29 checks. Four axe WCAG scans reported zero violations across desktop, certificate dialog, paused game, and mobile. Browser runtime error telemetry was empty.
- The lifecycle suite passed seven checks. It verified one Locomotive-owned scroll engine, stable listeners across client routes, anchor alignment and history, the desktop Education pin, reduced-motion cleanup, and the WebGL fallback.
- Wheel input hid and revealed the translucent header. Small direction changes left it stable. Tab focus brought it back on screen, and the header stayed visible during anchor travel.
- Brainwiz and LaserHacks opened their matching certificates. Full-row pointer movement, edge clamping, Escape, modal focus restoration, and touch taps passed. OlympAI and Smart India Hackathon have no corresponding asset or active preview. The corrected LaserHacks status was verified in HTML and the generated text edition.
- The original cutout fit under the header at 1366 × 768. Visual checks also covered the phone hero and closing portrait at 390 × 844. Skill Set preserved all 55 labels, and every skill row has a decorative mark. The new closing portrait loads independently from the hero.
- The six case studies, structured data, robots, sitemap, and AI-readable resources remain available. Chrome and Edge passed. Safari, Firefox, physical devices, and manual screen reader testing were outside the available environment.

[Integration evidence](reports/v4/integration.json) · [Lifecycle evidence](reports/v4/lifecycle.json) · [Evidence audit](V4-EVIDENCE-AUDIT.md)
