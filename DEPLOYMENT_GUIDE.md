# Deploy Piyush Rajput’s portfolio to Cloudflare

This guide uses the existing Next.js build and a Cloudflare Worker with a D1 database. The Worker serves the portfolio and the leaderboard from the same address. Next.js generates the pages, images, and fonts ahead of time. The Worker runs the live score API, validates each run, and stores verified results in D1. This fits the project’s existing split between generated pages and a Worker API. Cloudflare recommends vinext for applications that need the Next.js runtime on Workers. Here, the native Worker can serve the existing Next.js build directly. [Cloudflare Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) · [Worker static assets](https://developers.cloudflare.com/workers/static-assets/)

Follow one numbered step at a time. Steps 1 and 2 are local preparation. Use your own Cloudflare account and create a separate Worker and database. **Get explicit approval before enabling a public address or updating any existing production resource.** Keep the current private portfolio available while setting up the new deployment.

## 1. Open the project and sign in

1. Install [Node.js 24 LTS](https://nodejs.org/en/download) and [Git for Windows](https://git-scm.com/install/windows) if needed.
2. In VS Code, choose **File → Open Folder** and select the existing `piyush-portfolio` folder, the one that contains `package.json`. Choose **Terminal → New Terminal** and select PowerShell. You can also use the terminal in the existing Codex project.
3. Check the tools and install the locked dependencies.

   ```powershell
   node --version
   npm.cmd --version
   git --version
   git status --short --branch
   npm.cmd ci
   ```

   Expect Node `v24.x.x`, version numbers for npm and Git, and your current branch, normally `main`. If a command is missing after installation, close and reopen your terminal. If `npm.cmd ci` cannot find `package.json`, reopen the project folder in the terminal.
4. Open the [Cloudflare dashboard](https://dash.cloudflare.com/). Sign in or create an account and verify your email. Select your account, then open **Workers & Pages**. Use the Free plan. Look for **Your subdomain** and follow the dashboard’s setup prompt if the account has no `workers.dev` subdomain yet. **Change** next to **Your subdomain** edits an existing account subdomain. [Cloudflare workers.dev setup](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)
5. Connect Wrangler, Cloudflare’s terminal tool, to that same account.

   ```powershell
   npx.cmd wrangler login
   npx.cmd wrangler whoami
   ```

   Approve Wrangler in the browser. `whoami` should show the account you selected. If sign-in fails or shows a different account, check the browser account and run `npx.cmd wrangler login` again. Keep your credentials in the browser.

## 2. Check the Worker and leaderboard on your computer

Open PowerShell in the project folder. Build the assets, apply the SQL migration to the local D1 emulator, and create a local signing key only if `.dev.vars` is missing.

```powershell
npm.cmd run build
npx.cmd wrangler d1 migrations apply DB --local
if (-not (Test-Path -LiteralPath '.dev.vars')) {
  node -e "process.stdout.write('LEADERBOARD_SIGNING_KEY=' + require('node:crypto').randomBytes(32).toString('hex'))" |
    Set-Content -LiteralPath '.dev.vars' -Encoding ascii
}
npm.cmd run cf:dev
```

If you copied `.dev.vars.example` previously, replace its example value with a separate random key in your local `.dev.vars`. Git ignores this file. The database and its rows in this test live on your computer. The initial placeholder database ID in `wrangler.jsonc` is sufficient for local development.

The build should generate `dist/client/` and `dist/server/index.js`. The migration should apply `0000_signal_run_leaderboard.sql` or report that it already ran. Wrangler should print a local URL, typically `http://localhost:8787`. Open its `/play/` page and submit a score from a ranked arcade run. Refresh, then open the same URL in a second browser or private window. A score returned in both windows came from the local server. The browser’s personal best is separate.

Open the home page, switch between Editorial and Cyber, scroll through the chapters, and test a narrow window. Check the images, project pages, `/sitemap.xml`, `/robots.txt`, and `/llms.txt`. Stop the server with **Ctrl+C**. If the leaderboard says it is unavailable, check the local migration and `.dev.vars`, then restart. For a separate fast SQL and API test run `node scripts/verify-leaderboard.mjs`.

## 3. Create and connect the new D1 database

When ready to provision your new free database, check existing names before creating it. This database is independent of the one serving the private portfolio. Scores from the private deployment require a separately approved transfer.

```powershell
npx.cmd wrangler d1 list
npx.cmd wrangler d1 create signal-run-leaderboard
```

Run the second command when `signal-run-leaderboard` is available in the selected account. If the name is already in use, stop and check ownership before you choose an unused name. Success prints a `database_id`. If Wrangler offers to edit the configuration automatically, choose **No** and use the existing binding below. You can also create the database in **Storage & Databases → D1 → Create Database** and copy its ID from the dashboard. [Cloudflare D1 setup](https://developers.cloudflare.com/d1/get-started/)

In the project’s `wrangler.jsonc`, replace the placeholder `00000000-0000-4000-8000-000000000000` with that UUID. Keep the binding `DB` and the migration directory `drizzle`. If you chose a different database name, update `database_name` too. A UUID identifies the database. Account permissions grant access.

Apply the existing migration to the new database and check the table names.

```powershell
npx.cmd wrangler d1 migrations apply DB --remote
npx.cmd wrangler d1 execute DB --remote --command "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('signal_run_scores', 'signal_run_rate_limits') ORDER BY name;"
```

Expect `signal_run_scores` and `signal_run_rate_limits`. The score table starts empty. In the dashboard, the D1 page also shows the database under the account selected at sign-in. If Wrangler reports that the database cannot be found, check the account, UUID, and name before retrying. [Cloudflare D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/) · [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)

## 4. Push the project to a private GitHub repository

1. Sign in to GitHub. Open [New repository](https://github.com/new), choose your account as owner, enter `piyush-portfolio`, select **Private**, and click **Create repository**. Leave the README, license, and `.gitignore` options empty since this project already has Git history.
2. In PowerShell, review the changes. Stage and commit only the project files you intend to upload. Check that the staged list excludes `.env.local`, `.dev.vars`, databases, and backups. The Worker config, migration SQL, and database UUID belong in the repository.

   ```powershell
   git status --short --branch
   git add -A
   git diff --cached --name-only
   git diff --cached --check
   git commit -m "Prepare portfolio for Cloudflare Workers"
   ```

   Skip the commit if Git says there is nothing to commit.
3. Copy the HTTPS URL shown on the new GitHub repository. Replace `YOUR_GITHUB_USERNAME` below. The new remote is named `github` so any existing remote stays available.

   ```powershell
   git remote -v
   git remote add github https://github.com/YOUR_GITHUB_USERNAME/piyush-portfolio.git
   git push -u github main
   ```

   If a `github` remote is already listed, confirm it points to this exact private repository and skip the `remote add` line. Complete any browser sign-in Git prompts for. Refresh GitHub and verify the **Private** badge and the latest commit. If the push is rejected because the remote contains a separate commit, inspect that repository before proceeding and avoid a force push. [GitHub guide to pushing existing code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)

## 5. Create the new Worker with public routes disabled

After approval to create the new Cloudflare Worker, go to **Cloudflare → Workers & Pages** and check that `piyush-portfolio` is unused in the account. Use a different name in `wrangler.jsonc` if a Worker with that name already exists. Confirm `workers_dev` and `preview_urls` are both `false` and that the config has no custom routes.

Set the planned address before building. Replace `YOUR_SUBDOMAIN` with your Cloudflare account subdomain. If you changed the Worker name, use that name in the URL too.

```powershell
$env:NEXT_PUBLIC_SITE_URL = 'https://piyush-portfolio.YOUR_SUBDOMAIN.workers.dev'
npm.cmd run build
npm.cmd run cf:deploy
```

Wrangler should report an upload for the new Worker. **Workers & Pages → piyush-portfolio → Bindings** should show the intended D1 database under `DB`. A public URL is expected to remain disabled at this step. [Worker bindings](https://developers.cloudflare.com/d1/best-practices/remote-development/)

Set the signing secret for the new Worker. This command generates a random value and pipes it directly into Wrangler.

```powershell
node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))" |
  npx.cmd wrangler secret put LEADERBOARD_SIGNING_KEY
```

Success lists the secret’s name under **Settings → Variables and Secrets** with a hidden value. For future deployments, keep the same secret so active ranked sessions remain valid. The API normally uses the incoming site URL to validate requests. Set `LEADERBOARD_ORIGIN` only when a reverse proxy changes that URL, and set it to the exact external HTTPS origin without a trailing slash. `NEXT_PUBLIC_SITE_URL` is a public build setting for SEO. `LEADERBOARD_SIGNING_KEY` belongs in the Worker runtime secret store. Leave `LEADERBOARD_TRUST_SITES_IDENTITY` unset on this new Worker so rate limits use Cloudflare’s client IP. [Cloudflare secrets](https://developers.cloudflare.com/workers/configuration/secrets/) · [Client IP headers](https://developers.cloudflare.com/fundamentals/reference/http-headers/#cf-connecting-ip)

## 6. Connect the existing Worker to GitHub

1. Open **Workers & Pages → piyush-portfolio → Settings → Build**. Under **Git Repository**, select **Connect** and choose GitHub.
2. Authorize Cloudflare in GitHub and choose **Only select repositories**. Select the private `piyush-portfolio` repository. Back in Cloudflare, choose that repository for your existing Worker.
3. Enter these settings. Cloudflare builds on Linux, which uses `npm` rather than `npm.cmd`.

   | Field | Value |
   | --- | --- |
   | Production branch | `main` |
   | Root directory | Repository root. Leave blank if the field is optional |
   | Build command | `npm run build` |
   | Deploy command | `npm run cf:deploy` |
   | Preview builds | Off until you configure an isolated preview database and secret |
   | Build variable `NEXT_PUBLIC_SITE_URL` | The complete planned HTTPS address from Step 5 |
   | Build variable `NODE_VERSION` | `24` |

4. Save the settings. Use Cloudflare’s automatically managed build token. The Worker name in `wrangler.jsonc` must match the Worker you connected. Verify the build log shows a successful build and deploy for the latest Git commit. Future pushes to `main` trigger this same build and deploy. Run D1 migrations separately when the schema changes. [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) · [Git integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/) · [Build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)

## 7. Enable the free address and verify

**This step makes the new site public. Wait for explicit approval.** In `wrangler.jsonc` set `workers_dev` to `true` and keep `preview_urls` set to `false`. Commit the setting and push it to `main`.

```powershell
git add wrangler.jsonc
git commit -m "Enable the approved portfolio address"
git push github main
```

Once Cloudflare reports success, open **Workers & Pages → piyush-portfolio → Settings → Domains & Routes**. The HTTPS address should be `https://piyush-portfolio.YOUR_SUBDOMAIN.workers.dev`. Cloudflare manages HTTPS for this address. If it is missing, check that the account subdomain exists and that the build deployed the commit with `workers_dev` enabled. [Cloudflare workers.dev routing](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)

Open the home page and `/play/` in your browser. An empty leaderboard on a new database is expected. Play a ranked run, submit a username you intend other visitors to see, then refresh and open the public address in a second browser or on a second device. The same score should appear in the shared Top 10 if it ranks. Check both themes, navigation, images, fonts, scrolling, and the mobile layout. Confirm that `/sitemap.xml` and each page’s canonical URL use the deployed address. Visit `/robots.txt` and `/llms.txt` too.

To inspect the API directly in PowerShell, replace `YOUR_SUBDOMAIN` below.

```powershell
$site = 'https://piyush-portfolio.YOUR_SUBDOMAIN.workers.dev'
Invoke-RestMethod "$site/api/leaderboard" -UserAgent 'Portfolio-Deployment-Check/1.0' |
  ConvertTo-Json -Depth 5
```

Expect a JSON object with `entries`. A successful ranked submission is stronger evidence than an empty-list response, since it verifies writes as well as reads.

## 8. Add a custom domain later

When you have approved a new hostname and added its domain to Cloudflare, open **Workers & Pages → piyush-portfolio → Settings → Domains & Routes → Add → Custom Domain**. Enter a new hostname such as `portfolio.example.com`. Cloudflare creates the DNS record and issues the certificate. If a DNS record already serves that hostname, stop before replacing it. Domain registration can cost money. [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

Keep the chosen hostname in the deployment config so later pushes preserve it. Add the following property to `wrangler.jsonc` and replace the example hostname.

```json
"routes": [
  { "pattern": "portfolio.example.com", "custom_domain": true }
]
```

Update `NEXT_PUBLIC_SITE_URL` in the Worker’s **Settings → Build → Build variables and secrets** to the custom HTTPS origin. If `LEADERBOARD_ORIGIN` is configured, update that runtime value too. Push the config change and verify the new address and its HTTPS certificate, canonical URLs, and score submissions. Keep `workers_dev` set to the approved state.

## Protect scores during updates

Deploy code changes using the same Worker and `DB` binding. Cloudflare keeps the database outside the build. A code deployment preserves records as long as it points at the same database and any schema changes preserve the rows.

For a schema change, add a new SQL file in `drizzle/` and leave applied migrations intact. Test locally first. Back up the cloud database before applying a production migration.

```powershell
npx.cmd wrangler d1 migrations apply DB --local

New-Item -ItemType Directory -Path backups -Force | Out-Null
$backupStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
npx.cmd wrangler d1 export DB --remote --output "backups/signal-run-$backupStamp.sql"

npx.cmd wrangler d1 migrations list DB --remote
npx.cmd wrangler d1 migrations apply DB --remote
```

Use `--remote` only after checking the target account and database and reviewing the migration. The backup contains usernames and scores. Store it privately outside Git. For recovery, Cloudflare D1 Time Travel supports point-in-time restore, with seven days of history on Free. First identify the recovery bookmark using `npx.cmd wrangler d1 time-travel info DB --timestamp <UTC_TIMESTAMP>` and take a fresh export. After approval, `npx.cmd wrangler d1 time-travel restore DB --bookmark <BOOKMARK>` restores that state. This can discard scores submitted since the selected point. [D1 export and recovery commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/) · [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)

For a broken code release, open **Workers & Pages → piyush-portfolio → Deployments**, find the last healthy version, choose its **⋯ → Rollback**, and verify the site again. A Worker rollback switches code and assets. D1 data and schema need their own recovery if they changed. Revert or fix the offending Git commit before the next automatic deployment. [Worker rollback guide](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/) · [Future editing guide](./HOW_TO_UPDATE.md)

## Free plan and troubleshooting

Cloudflare’s Free plan currently includes 100,000 Worker requests per day, 10 ms of CPU per Worker invocation, and 3,000 build minutes per month. Ordinary asset requests such as generated pages, CSS, fonts, and images are served directly. Score requests run the Worker. Replaying a run close to the 30-minute ranking limit can exceed the Free CPU allowance. The deployed account’s CPU use still needs measurement. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) · [Asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) · [Workers Builds pricing](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)

D1 Free includes 5 million rows read and 100,000 rows written per day, 500 MB per database, and 5 GB total storage per account. When a daily D1 quota is reached, database queries fail until midnight UTC. The game can still play in practice or offline mode. Check actual use in your Worker and D1 dashboards. Workers Paid currently starts at US$5 per account per month, plus charges for usage above its included allowances. Check the current terms before approving an upgrade. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) · [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) · [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

| What you see | What to check |
| --- | --- |
| Build says `dist/client` or `dist/server/index.js` is missing | Run `npm.cmd run build` locally. In Cloudflare confirm the root directory and the build command. Check the first failing line in the build log. |
| GitHub repository is missing from Cloudflare | Open **Settings → Build → Git Repository → Manage** and grant the Cloudflare GitHub app access to the private repository. |
| Push reaches GitHub but there is no deployment | Check the connected repository, production branch, and latest build status in Cloudflare. |
| Worker name mismatch or permission error | Match `name` in `wrangler.jsonc` to the intended Worker and check `npx.cmd wrangler whoami`. Review the Cloudflare build token in the dashboard if the error only occurs in CI. |
| API returns `503` | Check `DB`, the database migration, the runtime signing secret, and D1 usage limits. Open the Worker’s logs if the configuration looks correct. |
| API returns `403` on score submission | Start a new run from `/play/` on the intended HTTPS address. Check `LEADERBOARD_ORIGIN` if you set it. |
| API returns `429` | Wait for the indicated retry interval, then try again. The API limits repeated score starts and submissions. |
| New score is absent from Top 10 | Compare the final score with the tenth entry and verify the submission succeeded. Local personal bests and unranked practice do not write to the shared board. |
| Browser shows a certificate or hostname error | Confirm the URL under **Domains & Routes** and wait for the managed certificate to become active. Check the hostname’s DNS in Cloudflare. |
| SEO links point to the old host | Fix `NEXT_PUBLIC_SITE_URL` in Build variables and rebuild the site. |
