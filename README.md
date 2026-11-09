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

`npm run preview` serves `out/` at `http://localhost:3000`. To preview both the static export and the leaderboard, run `npm run preview:leaderboard` on Node 24 and open `http://127.0.0.1:3000/play/`. This preview uses a separate local SQLite file in `.sites-runtime/`. Set `LEADERBOARD_PREVIEW_IN_MEMORY=1` for a disposable database. Stop the development server before starting a preview on the same port.

Portraits use `next/image` with a custom loader selecting pre-optimized 640, 828, 1080, and 1600-pixel variants (AVIF with alpha for the hero). This supports static hosting without a runtime image server. If portrait sources change, inspect `scripts/optimize-assets.mjs` and regenerate all expected variants before building. For the hero cutout and its responsive variants alone, run `npm run assets -- --portrait-only`. The saved alpha mask is combined with the unaltered source RGB channels. Run `npm run assets -- --closing-only` for the closing portrait’s three AVIF sizes.

## Deploy to Cloudflare Workers

Follow [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) to set up the Worker, D1, and GitHub builds. Use [HOW_TO_UPDATE.md](HOW_TO_UPDATE.md) for local edits, previews, deployment, and rollback.

## Deploy to Vercel

1. Put this project in a Git repository and import it into Vercel. If it is inside a larger repository, set the Vercel Root Directory to this folder.
2. Set the framework to Next.js, the install command to `npm ci`, and the build command to `npm run build`.
3. Add `NEXT_PUBLIC_SITE_URL` for the intended production origin, then deploy. The Next.js static export is emitted to `out/`; if the hosting configuration requests an output directory, use `out`.
4. When adding or changing a production domain, update the variable and rebuild so canonical and sitemap URLs follow the domain.
5. Verify the home page, all six `/projects/<slug>/` routes, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/llms-full.txt` on the deployed origin.

The static export supports offline gameplay. The global leaderboard requires the accompanying Worker and database.

## Leaderboard deployment

The existing Sites deployment reads `.openai/hosting.json`, provisions the D1 binding `DB`, and applies the schema in `drizzle/`. The production build emits the Worker in `dist/server/` and the original static Next.js export in `dist/client/`. Configure a random `LEADERBOARD_SIGNING_KEY` of at least 32 bytes in the hosted runtime's secret store. Keep that value server-side.

For separate hosting, deploy the two outputs on the same origin, route `/api/leaderboard*` to the Worker, bind a D1 database as `DB`, and apply the migration before accepting scores. Set `LEADERBOARD_ORIGIN` to the public origin if a reverse proxy rewrites the Worker request URL. Runs remain playable if the API is unavailable, and local personal bests stay on the device.

## Project layout

```text
piyush-portfolio/
├── src/
│   ├── app/                   # Server-rendered App Router pages and metadata
│   ├── components/
│   │   ├── chapters/          # Education, Skill Set, and Evidence
│   │   ├── motion/            # Scoped GSAP chapter drivers
│   │   ├── portrait/          # Interactive alpha-masked ASCII portrait
│   │   ├── game/              # Lazy Signal Run canvas game
│   │   └── spatial/           # Mind exploration and optional R3F/GLSL scene
│   ├── content/portfolio.ts   # Public factual content
│   ├── lib/                   # Site origin and static image loader
│   └── styles/                # SCSS tokens and global styles
├── public/
│   ├── images/                # Optimized supplied portraits and original graphics
│   ├── certificates/          # Verified certificate previews and detail images
│   ├── icons/skills/          # Self-hosted skill marks and licenses
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

Scoped GSAP timelines handle chapter entrances, parallax and the desktop Education pin. The engine loads on visitor intent, while HTML and imagery paint immediately. Locomotive Scroll v5 owns fine-pointer smoothing on the native window and follows GSAP’s ticker. GSAP also slides the glass header on scroll direction. Motion animates the mobile menu, Anime.js handles decorative glyphs, and React Three Fiber runs the optional spatial shader. The portrait draws its alpha-clipped glyph field only during interaction. The game has a separate canvas loop while playing.

Touch devices retain native momentum scrolling; reduced-motion preferences retain visible content and native scrolling. Anchors, browser history, focus indicators, keyboard navigation, and game Skip remain available. WebGL is an enhancement, and essential content is rendered in HTML. The game begins only after Start and can be paused or skipped.

## Content and known gaps

The supplied master dossier covers the original chapters. The uploaded Education and Technical Skills document is the source for those two V3 chapters and their text resources. Unconfirmed school and programme wording, academic dates, and the conflicting Class 12 percentage are omitted. See `docs/V3-CONTENT-AUDIT.md` for decisions. The finalized theme controls the visual direction. Built projects, prototypes, proposed architecture, and learning are labelled separately. The playable game is a portfolio feature, not a historical competition project.

Brainwiz and LaserHacks show their matching supplied participation certificates. OlympAI and Smart India Hackathon have no matching assets yet. See `docs/V4-EVIDENCE-AUDIT.md`. A professional email, verified project-specific repositories, live demos, project screenshots, and prototype photos are still unavailable. GitHub and LinkedIn use the exact supplied public URLs. There are no fabricated demos, employment claims, hardware outcomes, or historical performance scores. See `docs/CONTENT-AUDIT.md` for the full mapping and missing evidence.

Performance and accessibility scores must be measured against the production output. The implementation targets fast first paint, stable layout, bounded GPU work, lazy heavy features, and accessible interaction; this README does not claim a Lighthouse or accessibility score without an executed audit.

## Verification

See `docs/VERIFICATION.md` for measured results and limits. Re-run integration checks against `npm run preview` using `node scripts/verify.mjs` and `node scripts/verify-lifecycle.mjs` (installed Chrome required; lifecycle additionally checks Edge when installed). Public Markdown files regenerate from the central content module automatically before builds.
