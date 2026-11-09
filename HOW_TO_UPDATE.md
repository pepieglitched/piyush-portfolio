# How to update your portfolio

Edit the existing project, test it locally, commit your changes, push to GitHub, then verify the Cloudflare deployment. Once Workers Builds is connected to your private GitHub repository and configured to deploy, a push or merge to `main` triggers a build and deployment to the same Worker. The private repository controls who can see the source. Cloudflare controls who can visit the deployed site. For the first deployment, follow the [deployment guide](DEPLOYMENT_GUIDE.md). [Cloudflare production branches](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/)

## 1. Open the project and start a branch

In Codex, open a local project and select the existing `outputs/piyush-portfolio` folder. In VS Code, use **File → Open Folder** and select that same folder. These PowerShell commands also open it in VS Code.

```powershell
Set-Location -LiteralPath 'C:\Users\hello\Documents\Codex\2026-11-06\master-prompt-build-piyush-rajput-s\outputs\piyush-portfolio'
code .
```

If `code .` is unavailable, use **File → Open Folder** in VS Code. If you move or clone the project later, use its new location. [VS Code on Windows](https://code.visualstudio.com/docs/setup/windows)

Once the GitHub remote is set up, start a branch from the latest `main`.

```powershell
git status --short
git switch main
git pull --ff-only github main
git switch -c update/portfolio-content
```

Run the last three commands from a clean working tree. If `git status --short` lists unfinished edits, review those first. Use a fresh branch name for each new change.

In Codex, describe the exact change. For example, “Update the bio in `src/content/portfolio.ts` with this text, test the existing site locally, and show me the diff before pushing.” Select the existing project each time. Use the same GitHub repository and Cloudflare Worker for future edits.

## 2. Find the right file

| What to change | File or folder |
| --- | --- |
| Bio, profile links, education, skills, projects, and achievements | `src/content/portfolio.ts`. Each project has a unique `slug` that becomes its URL under `/projects/`. |
| Home page sections and layout | `src/app/page.tsx` and `src/app/page.module.scss`. Education, Evidence, and Skill Set have their own components in `src/components/chapters/`. |
| Project listing and detail page design | `src/app/projects/page.tsx`, `src/app/projects/[slug]/page.tsx`, and `src/app/projects/projects.module.scss`. |
| Portfolio images and certificates | Source portraits are in `assets/source/`. Optimized images are in `public/images/`. Certificate images are in `public/certificates/`, and their references are in `src/components/chapters/EvidenceChapter.tsx`. |
| Editorial and Cyber themes, navigation, and scroll motion | `src/styles/_themes.scss`, `src/styles/_tokens.scss`, `src/components/Navigation.tsx`, `src/components/Navigation.module.scss`, `src/components/Experience.tsx`, and `src/components/motion/ChapterDriver.tsx`. |
| Game page, controls, physics, and rendering | `src/app/play/page.tsx` and `src/components/game/`. `SignalRun.tsx` manages play and controls, `runner.ts` defines scoring and physics, and `runner-renderer.ts` draws the game. |
| Leaderboard display and server | `src/components/game/RunnerLeaderboard.tsx` is the display, `src/components/game/leaderboard.ts` calls the API, and `worker/leaderboard.ts` verifies and stores scores. D1 migration files are in `drizzle/`. |
| Search and text resources | `src/app/layout.tsx`, `src/app/sitemap.ts`, and `src/app/robots.ts`. The build generates `public/llms.txt`, `public/llms-full.txt`, and the public Markdown pages via `scripts/generate-resources.mjs`. Change the source content or the generator for those resources. |

To add a chapter, create a component and its SCSS module in `src/components/chapters/`, then render it in `src/app/page.tsx`. If it needs an animation, follow an existing chapter's `MotionChapter` and `ChapterDriver` setup. Test the chapter with reduced motion enabled and with keyboard navigation.

When changing the closing portrait, replace `assets/source/closing-portrait.png` and regenerate its variants.

```powershell
npm.cmd run assets -- --closing-only
```

For a hero image change, review the matching alpha mask in `assets/source/hero-alpha-mask.png`. The hero script expects the source and mask to match. Use `npm.cmd run assets -- --portrait-only` to rebuild the transparent hero and its variants after updating both files. Check `src/lib/image-loader.ts` for the file names the browser requests. Commit the optimized images along with the source change.

## 3. Test locally

Install the locked dependencies the first time you open the project or when the lockfile changes. Start the development server for quick visual edits.

```powershell
npm.cmd ci
npm.cmd run dev
```

Open `http://localhost:3000`. Next.js shows your edits as you save. Stop the server with **Ctrl+C** and build the production files for a Wrangler preview.

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
node scripts/verify-leaderboard.mjs
npm.cmd run cf:dev
```

Follow the local D1 setup in the [deployment guide](DEPLOYMENT_GUIDE.md) before testing the leaderboard in Wrangler. Open the local URL printed by Wrangler. Keep its PowerShell window open. In a second window, set `TEST_URL` to that origin and run the browser checks.

```powershell
$env:TEST_URL = 'http://127.0.0.1:8787'
node scripts/verify.mjs
node scripts/verify-lifecycle.mjs
Remove-Item Env:TEST_URL
```

Use the actual port Wrangler printed if it differs. These checks use installed Chrome, and the lifecycle checks also use Edge when available. See `test-results/verification.json` and `test-results/lifecycle.json` if a check fails.

Try the feature you edited on a narrow screen and a desktop width. Check both themes, then open a project detail page and `/play/`. For a leaderboard change, finish a ranked run locally and submit a score. Reload and open `/api/leaderboard` from a second browser profile on the same local server. The returned `entries` should include the score with its rank when it qualifies for the top 10. The server replays ranked runs to calculate the score. If you change the replay logic, check a long ranked run in an approved Cloudflare Preview and inspect its CPU time. The Workers Free plan allows 10 milliseconds of CPU time per invocation. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)

## 4. Commit, push, and verify

Review the changes and stage the files you intend to publish. For a bio edit, include the source and generated profile files.

```powershell
git status --short
git diff
git add -- src/content/portfolio.ts public/about.md public/llms-full.txt
git diff --cached
git commit -m "Update portfolio bio"
git push -u github update/portfolio-content
```

Adapt the staged paths to your edit. Include changed generated text resources or optimized assets that belong to it. Keep local secrets in the ignored `.dev.vars` file and database exports in the ignored `backups/` folder. Check the staged list before committing.

1. Open your private repository on GitHub. Click **Compare & pull request** and check that the base is `main` and the compare branch is yours. Review **Files changed**, then click **Create pull request**. [GitHub pull requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request)
2. Use your local preview to review the change. The Cloudflare setup starts with preview URLs disabled. If you later enable approved Preview builds, open the Preview URL in the Worker or in the pull request comment. Bind that Preview to a separate D1 database and give it its own signing secret before testing scores there. [Cloudflare Preview isolation](https://developers.cloudflare.com/workers/previews/resources/)
3. When you approve the update for production, merge the pull request. If enabled, **Squash and merge** gives the update one commit you can revert later. Cloudflare starts the production build when GitHub updates `main`. [GitHub merge options](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-a-pull-request)
4. In Cloudflare, open **Workers & Pages → your Worker → Deployments → View build history**. Check that the build for your commit succeeds and the new version is active. Open the live site and retest the feature you changed. For the leaderboard, check that `/api/leaderboard` returns JSON and `/play/` can start a ranked run. [Cloudflare build logs](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/)

For a failed build, open its log and fix the first error on your branch. Push the fix, verify the next build, and refresh the live page after deployment succeeds.

## 5. Preserve scores and roll back safely

The Worker reads scores from the D1 database connected as `DB`. Keep the same production database ID in `wrangler.jsonc` for ordinary updates. A code deployment publishes the new Worker and assets, while the existing score rows stay in D1. Run database migrations as a separate step. For a schema change, add a new SQL migration, test it locally, back up D1, and apply the migration deliberately before deploying code that needs it. Follow the [database steps in the deployment guide](DEPLOYMENT_GUIDE.md). [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)

If the live site breaks, open **Workers & Pages → your Worker → Deployments**. Find a known working version, click its **…** menu, choose **Rollback**, and verify the live page again. A Worker rollback changes the active code and assets. D1 retains its current rows and schema, so choose a code version compatible with the current schema. [Cloudflare rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

Bring GitHub back into sync after a dashboard rollback. For a single bad commit on `main`, create a repair branch from the latest `main`, then revert that commit.

```powershell
git switch main
git pull --ff-only github main
git switch -c fix/revert-last-update
$badCommit = Read-Host 'Enter the bad commit SHA from GitHub'
git revert $badCommit
git push -u github fix/revert-last-update
```

Test the repaired branch, open a pull request, and merge it when ready. For a merge commit, ask Codex to inspect the history and prepare the revert before committing.

Recover a database separately if a migration damaged it. Export the current data and review the restore point first. A Time Travel restore returns rows and schema to that point and can discard scores posted afterwards. Use it only for an approved database recovery. [D1 Time Travel and backups](https://developers.cloudflare.com/d1/reference/time-travel/)
