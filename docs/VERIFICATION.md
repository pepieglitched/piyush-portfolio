# Portfolio Iteration V3 verification — 7 November 2026

The exported production build was served at `http://localhost:3000`. The Lighthouse results use local Chrome with the standard mobile and desktop presets.

| Lighthouse 13.6 | Mobile | Desktop |
| --- | ---: | ---: |
| Performance | 79 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 100 | 100 |
| SEO | 100 | 100 |
| First Contentful Paint | 1.24 s | 0.35 s |
| Largest Contentful Paint | 3.39 s | 0.74 s |
| Total Blocking Time | 493 ms | 37 ms |
| Cumulative Layout Shift | 0 | 0.012 |

Mobile FCP and CLS met the requested targets. The 90+ performance score and 2.5-second LCP remain open on the mobile lab preset. Field INP and deployed network performance were not measured. TBT is the lab responsiveness measure shown here.

[Mobile report](reports/v3/lighthouse-mobile.html) · [Desktop report](reports/v3/lighthouse-desktop.html)

## Build and browser checks

- `npm.cmd run build`, `npm.cmd run typecheck`, and `npm.cmd run lint` passed. The production export generated the home, project archive, six case studies, sitemap, and robots files.
- The Chrome integration suite passed 23 checks. Three axe WCAG scans reported zero violations across desktop, paused game, and mobile. Browser error telemetry was empty.
- The lifecycle suite passed six checks. Three client route cycles preserved all nine chapter drivers and stable native listeners. Reduced motion removed Lenis, the desktop pin, and word transforms. The Education timeline advanced with scroll and its sidebar had exactly one pin.
- All six desktop anchors settled below the floating nav. Touch Skills navigation landed under the header before game code loaded. Keyboard controls, menu Escape, portrait hover and restore, touch portrait toggle, and mobile game input passed.
- The transparent source has 692,081 fully transparent pixels. All 1,573,230 original RGB pixels are preserved. The final browser uses responsive alpha AVIF. Page 7 loads the supplied second sunglasses portrait.
- Layouts from 360 to 1920 pixels avoided horizontal overflow. Verified project and skill content remained available without JavaScript. Chrome and Edge smoke checks passed, along with the WebGL-unavailable fallback.
- All six project pages and their JSON-LD parsed. Robots, sitemap, canonical/preview metadata, and the six text resources were checked. Education and skill content follows the uploaded source, with unresolved details recorded in the [content audit](V3-CONTENT-AUDIT.md).

[Integration evidence](reports/v3/integration.json) · [Lifecycle evidence](reports/v3/lifecycle.json)

Physical-device, Safari, Firefox, and manual screen reader testing were outside the available environment. GSAP private ticker/trigger counts are unavailable from the export. The checks observe stable listeners, pin spacers, active motion, and reversion instead. The Site uses owner-only access. Set `NEXT_PUBLIC_SITE_URL` before building for a separate public deployment so canonical and structured data URLs match.
