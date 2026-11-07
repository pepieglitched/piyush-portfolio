# Implementation

## Design and story

The supplied finalized theme is the visual authority. The current build request supersedes its historical “do not code yet” instruction. The portfolio is **The Builder's Mind: Playable Edition**, with the line **From curiosity to creation.** Its balance is approximately 80% editorial composition and 20% experimental/game language.

Archive Paper `#F3F0E8` and Carbon Ink `#0B0C0F` establish the page. Signal Red `#ED3345` marks important actions and graphic strokes. Electric Yellow `#F5D547` belongs mainly to game collectibles; Scanner Blue `#4568FF` marks small system details. Graphite `#33343A` and white complete the supplied palette. Space Grotesk carries the main hierarchy, Instrument Serif adds reflective contrast, and IBM Plex Mono carries metadata. Pixel lettering is reserved for brief game labels.

The opening system cue and chapters form one page:

| Chapter | Purpose |
| --- | --- |
| 00 — System Boot | Brief system identity, without a blocking loader. |
| 01 — The Human | Real halftone portrait and “I BUILD WHAT I IMAGINE.” |
| 02 — Inside the Mind | Intelligence, Software, and Physical Systems; optional spatial exploration. |
| Education — The Foundation | Documented academic milestones, current coursework, and interests. |
| 03 — Things I've Built | Six truthful project records with crawlable case studies. |
| 04 — Signal Run | Optional playable intermission with explicit Start and Skip. |
| 05 — Skill Set | Keyboard-accessible categories with documented project use, coursework and exploration. |
| 06 — The Evidence | Documented competition milestones, separate from game rewards. |
| 07 — Still Becoming | Supplied isolated sunglasses portrait with an upward wipe and reflection on continued learning. |
| 08 — Open Connection | Verified GitHub and LinkedIn links. |

The frontal halftone photograph anchors the hero. A separate alpha mask cuts it out while retaining the source RGB pixels. An intent-loaded Canvas 2D renderer samples alpha and luminance into a cached grid, erases a soft pointer region, and composites changing glyphs into the silhouette. The code toggle works with touch and keyboard and uses a static glyph frame under reduced motion. Page 7 uses the supplied isolated sunglasses portrait. A different supplied halftone image appears as the closing portrait stamp, with responsive AVIF variants.

## Application structure

Next.js App Router, React, TypeScript, and SCSS Modules provide the application. Server-rendered page content remains readable without WebGL or animation. Content lives in `src/content/portfolio.ts`; reusable components own their presentation. Project routes use the six content slugs and render static case studies. The build exports static output to `out/`.

Local fonts use `next/font`. Portrait variants are pre-optimized to responsive formats, including alpha WebP for the hero and selected through a custom `next/image` loader, so responsive images work on static hosting without a runtime optimization server. Preserve the 640/828/1080/1600 variant naming contract when replacing assets.

## Animation ownership

| System | Exclusive responsibility | Lifecycle |
| --- | --- | --- |
| GSAP + ScrollTrigger | Chapter masks, project wipes, editorial parallax, Education progress and desktop pin | Scoped `useGSAP` contexts, labelled timelines, SplitText reversion, and responsive matchMedia cleanup. |
| Locomotive Scroll 5.0.1 | Fine-pointer smoothing and anchor travel | Native window scroller, one engine, custom GSAP ticker, scroll callback to ScrollTrigger, and disposal on preference changes or unmount. |
| GSAP interaction motion | Directional header slide and Evidence pointer following | Independent transforms and scoped cleanup. Certificate movement tracks the pointer without React state on each event. |
| Motion for React | Lazily loaded mobile menu transition | React component lifecycle and reduced-motion settings. |
| Anime.js | Decorative glyph pulse and Skill Set label scramble | Local elements only, cancel on cleanup. |
| React Three Fiber + GLSL | Spatial mind illustration and shader uniforms | Dynamically loaded, bounded DPR, off-screen inactivity, disposed resources. |
| Canvas 2D | Signal Run gameplay rendering | Own requestAnimationFrame only during active gameplay; stop on pause, blur, completion, and unmount. |

Animation systems do not own the same transform or opacity properties on the same element. Where effects nest, each owner receives its own wrapper. ScrollTrigger owns scroll-driven presentation, while React owns content and interactive state. `contextSafe()` handles GSAP interaction callbacks where needed.

No motion blocks first meaningful paint. Reduced-motion mode keeps content visible, uses native scrolling, and substitutes quiet static presentation for continuous spatial movement. The game remains opt-in. Native anchors, browser history, keyboard navigation, and a skip link remain available.

## Chapter choreography

| Chapter | Motion |
| --- | --- |
| The Human | CSS masked line entrance, portrait rise, technical guide lines, and GSAP desktop scrubbed exit. |
| Inside the Mind | Orbital wipe, directional entrance, and parallax. |
| Education | Staggered milestone wipes, scroll-linked timeline, and a single pinned sidebar on large screens. |
| Selected Work | Opposing artwork wipes, layered guide lines, card parallax, and staggered archive rows. |
| Signal Run | Flanking guide lines draw in, the signal badge opens, and the continuation link wipes into view. |
| Skill Set | Category stagger, animated panel heading and brand marks, and a decorative label scramble. |
| The Evidence | Alternating directional row movement, animated separators, and verified cursor-following previews. |
| Still Becoming | An upward sunglasses portrait wipe with scrubbed scale and position. |
| Open Connection | Masked words, stamp rotation and wipe, and staggered links. |

## Interaction and responsive behavior

The floating navbar uses CSS backdrop blur, a pointer-tracked reflection, and a magnetic contact action. The wordmark is Piyush’s name. Active chapter indicators follow scroll. The sticky bar retreats on deliberate downward movement and returns on upward movement or keyboard focus. A lazy Motion panel provides keyboard-accessible links on small screens. Desktop uses oversized typography, asymmetric grids, framed photography, and restrained depth. Smaller screens recompose the layout into readable vertical sections with appropriate portrait crops and large controls. Nothing requires hover to discover essential information.

Signal Run is an original short robot game: collect AI, Software, and Robotics cores while avoiding bugs. It begins only after Start. Arrow keys/A–D move; jump keys and touch controls are explicit in the interface. Pause, Restart, and Skip remain available. The lazy game shell reserves its height so the later anchors remain stable. Game keys prevent page scroll only while gameplay has focus. Blur or pause releases control to the document. Sound is opt-in and muted by default.

## Search, AI readability, and performance

Metadata, canonical origins, Open Graph information, sitemap, robots, and JSON-LD are built from public content and `NEXT_PUBLIC_SITE_URL`. The default origin matches the owner-private Site. Set the variable before building for a separate public origin. No invented personal URL or project repository is used.

`/llms.txt`, `/llms-full.txt`, `/about.md`, `/projects.md`, `/skills.md`, and `/education.md` provide public text equivalents. These help clear content retrieval; they make no ranking guarantee.

The hero image has explicit dimensions and loading priority. Heavy WebGL and game logic load separately. GPU work is decorative; content does not depend on it. Production verification should include build, typecheck, lint, keyboard interaction, mobile layout, reduced motion, game lifecycle, fallback behavior, metadata, and public text routes. Performance and accessibility targets require measured audits; this plan does not claim they have passed.

## Startup budget refinements

GSAP and Locomotive load on the first visitor interaction; Motion loads when the mobile menu opens. WebGL probing waits until the mind chapter is near the viewport. The static orbital fallback remains visible until the GPU confirms its first draw. Offscreen chapters use CSS content visibility, while all text remains in the server HTML. Grain uses a tiny static SVG rather than a full-screen turbulence filter. Public Markdown resources regenerate from the central content module before every build. Small red text uses a darker accessible derivative of Signal Red.

Native chapter anchors preserve browser hash and history behavior. Fine-pointer links use Locomotive when active and retain the navbar offset and keyboard focus. Native CSS smooth scrolling is disabled to avoid a competing scroll clock. Coarse-pointer touch devices keep browser momentum scrolling. Focus, target hashes, or first visitor intent resolve skipped chapter layout before navigation or GSAP measurement.
