# Piyush Rajput — The Builder's Mind

A personal portfolio built with Next.js App Router, React, TypeScript, and SCSS. The story moves from editorial portraiture and real project records into an optional original arcade intermission, then returns to experiments, documented milestones, and human reflection.

## Run locally

Use Node.js 22.12 or newer (Node 24 LTS recommended) and npm. From this directory:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Development mode is useful for editing; use the exported production build for performance verification.

## Production build

Set `NEXT_PUBLIC_SITE_URL` to the real production origin **before building**. It supplies canonical, sitemap, and structured-data URLs. For example, create an untracked `.env.local`:

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-real-domain.example
```

Replace the example value with the actual origin. Then run:

```sh
npm run typecheck
npm run lint
npm run build
npm run preview
```

`npm run preview` serves `out/` at `http://localhost:3000`. Stop the development server before starting a preview on the same port. The application uses `output: 'export'`; use the static preview or `npm start` rather than `next start` for this output.

Portraits use `next/image` with a custom loader selecting pre-optimized 640, 828, 1080, and 1600-pixel variants (AVIF for the hero, WebP for the other portraits). This supports static hosting without a runtime image server. If portrait sources change, inspect `scripts/optimize-assets.mjs` and regenerate all expected variants before building. Keep the original identity and image proportions.

## Deploy to Vercel

1. Put this project in a Git repository and import it into Vercel. If it is inside a larger repository, set the Vercel Root Directory to this folder.
2. Set the framework to Next.js, the install command to `npm ci`, and the build command to `npm run build`.
3. Add `NEXT_PUBLIC_SITE_URL` for the intended production origin, then deploy. The Next.js static export is emitted to `out/`; if the hosting configuration requests an output directory, use `out`.
4. When adding or changing a production domain, update the variable and rebuild so canonical and sitemap URLs follow the domain.
5. Verify the home page, all six `/projects/<slug>/` routes, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/llms-full.txt` on the deployed origin.

No database, authentication service, email service, or private API key is required.

## Project layout

```text
piyush-portfolio/
├── src/
│   ├── app/                   # Server-rendered App Router pages and metadata
│   ├── components/
│   │   ├── game/              # Lazy Signal Run canvas game
│   │   └── spatial/           # Mind exploration and optional R3F/GLSL scene
│   ├── content/portfolio.ts   # Public factual content
│   ├── lib/                   # Site origin and static image loader
│   └── styles/                # SCSS tokens and global styles
├── public/
│   ├── images/                # Optimized supplied portraits and original graphics
│   ├── about.md
│   ├── projects.md
│   ├── skills.md
│   ├── llms.txt
│   └── llms-full.txt
├── scripts/optimize-assets.mjs
├── docs/
│   ├── IMPLEMENTATION.md
│   ├── CONTENT-AUDIT.md
│   └── VERIFICATION.md
├── next.config.ts
├── package.json
└── package-lock.json
```

## Motion and accessibility

GSAP owns hero and section timelines and parallax. Its engine loads on visitor intent, while readable HTML and imagery paint immediately. Lenis follows the GSAP ticker. Motion owns the lazily loaded mobile menu transition, Anime.js owns a local glyph pulse, and React Three Fiber owns the decorative spatial shader. The canvas game runs its own frame loop only while playing. Each animated element has one owner for its properties.

Touch devices retain native momentum scrolling; reduced-motion preferences retain visible content and native scrolling. Anchors, browser history, focus indicators, keyboard navigation, and game Skip remain available. WebGL is an enhancement, and essential content is rendered in HTML. The game begins only after Start and can be paused or skipped.

## Content and known gaps

The supplied master dossier is the factual source. The finalized theme controls the visual direction. Built projects, prototypes, proposed architecture, and learning are labelled separately. The playable game is a portfolio feature, not a historical competition project.

No professional email, verified project-specific repositories, current live demos, project screenshots, prototype photos, or certificate image files were supplied. GitHub and LinkedIn use the exact supplied public URLs. There are no fabricated demos, employment claims, hardware outcomes, or historical performance scores. See `docs/CONTENT-AUDIT.md` for the full mapping and missing evidence.

Performance and accessibility scores must be measured against the production output. The implementation targets fast first paint, stable layout, bounded GPU work, lazy heavy features, and accessible interaction; this README does not claim a Lighthouse or accessibility score without an executed audit.

## Verification

See `docs/VERIFICATION.md` for measured results and limits. Re-run integration checks against `npm run preview` using `node scripts/verify.mjs` and `node scripts/verify-lifecycle.mjs` (installed Chrome required; lifecycle additionally checks Edge when installed). Public Markdown files regenerate from the central content module automatically before builds.
