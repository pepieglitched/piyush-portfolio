# Piyush Rajput — The Builder's Mind

A personal portfolio built with Next.js App Router, React, TypeScript, and SCSS. The story starts with editorial portraiture and the Education timeline, moves through six project records and an optional arcade intermission, then closes with Skill Set, documented milestones, and a personal reflection.

## Run locally

Use Node.js 22.12 or newer (Node 24 LTS recommended) and npm. On Windows, use `npm.cmd` if PowerShell blocks `npm`. From this directory:

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`. Development mode is useful for editing; use the exported production build for performance verification.

## Production build

The build defaults to the existing private Site origin. For a separate deployment, set `NEXT_PUBLIC_SITE_URL` to that production origin **before building** so canonical, sitemap, and structured-data URLs agree. For example, create an untracked `.env.local`:

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

Portraits use `next/image` with a custom loader selecting pre-optimized 640, 828, 1080, and 1600-pixel variants (AVIF with alpha for the V3 hero). This supports static hosting without a runtime image server. If portrait sources change, inspect `scripts/optimize-assets.mjs` and regenerate all expected variants before building. For the hero cutout and its responsive variants alone, run `npm run assets -- --portrait-only`. The saved alpha mask is combined with the unaltered source RGB channels.

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
│   │   ├── chapters/          # Education timeline and Skill Set
│   │   ├── motion/            # Scoped GSAP chapter drivers
│   │   ├── portrait/          # Interactive alpha-masked ASCII portrait
│   │   ├── game/              # Lazy Signal Run canvas game
│   │   └── spatial/           # Mind exploration and optional R3F/GLSL scene
│   ├── content/portfolio.ts   # Public factual content
│   ├── lib/                   # Site origin and static image loader
│   └── styles/                # SCSS tokens and global styles
├── public/
│   ├── images/                # Optimized supplied portraits and original graphics
│   ├── about.md
│   ├── education.md
│   ├── projects.md
│   ├── skills.md
│   ├── llms.txt
│   └── llms-full.txt
├── scripts/optimize-assets.mjs
├── docs/
│   ├── IMPLEMENTATION.md
│   ├── CONTENT-AUDIT.md
│   ├── V3-CONTENT-AUDIT.md
│   └── VERIFICATION.md
├── next.config.ts
├── package.json
└── package-lock.json
```

## Motion and accessibility

Scoped GSAP timelines handle chapter entrances, parallax and the desktop Education pin. The engine loads on visitor intent, while HTML and imagery paint immediately. Lenis follows the GSAP ticker. CSS handles the floating glass bar, Motion animates the mobile menu, Anime.js handles decorative glyphs, and React Three Fiber runs the optional spatial shader. The portrait draws its alpha-clipped glyph field only during interaction. The game has a separate canvas loop while playing.

Touch devices retain native momentum scrolling; reduced-motion preferences retain visible content and native scrolling. Anchors, browser history, focus indicators, keyboard navigation, and game Skip remain available. WebGL is an enhancement, and essential content is rendered in HTML. The game begins only after Start and can be paused or skipped.

## Content and known gaps

The supplied master dossier covers the original chapters. The uploaded Education and Technical Skills document is the source for those two V3 chapters and their text resources. Unconfirmed school and programme wording, academic dates, and the conflicting Class 12 percentage are omitted. See `docs/V3-CONTENT-AUDIT.md` for decisions. The finalized theme controls the visual direction. Built projects, prototypes, proposed architecture, and learning are labelled separately. The playable game is a portfolio feature, not a historical competition project.

No professional email, verified project-specific repositories, current live demos, project screenshots, prototype photos, or certificate image files were supplied. GitHub and LinkedIn use the exact supplied public URLs. There are no fabricated demos, employment claims, hardware outcomes, or historical performance scores. See `docs/CONTENT-AUDIT.md` for the full mapping and missing evidence.

Performance and accessibility scores must be measured against the production output. The implementation targets fast first paint, stable layout, bounded GPU work, lazy heavy features, and accessible interaction; this README does not claim a Lighthouse or accessibility score without an executed audit.

## Verification

See `docs/VERIFICATION.md` for measured results and limits. Re-run integration checks against `npm run preview` using `node scripts/verify.mjs` and `node scripts/verify-lifecycle.mjs` (installed Chrome required; lifecycle additionally checks Edge when installed). Public Markdown files regenerate from the central content module automatically before builds.
