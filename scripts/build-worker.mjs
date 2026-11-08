import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
const server = new URL('server/', output);
const metadata = new URL('.openai/', output);

await rm(output, { recursive: true, force: true });
await Promise.all([mkdir(server, { recursive: true }), mkdir(metadata, { recursive: true })]);
await Promise.all([
  build({
    entryPoints: [fileURLToPath(new URL('worker/index.ts', root))],
    outfile: fileURLToPath(new URL('index.js', server)),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
  }),
  cp(new URL('out/', root), new URL('client/', output), { recursive: true }),
  cp(new URL('.openai/hosting.json', root), new URL('hosting.json', metadata)),
  cp(new URL('drizzle/', root), new URL('drizzle/', metadata), { recursive: true }),
  writeFile(new URL('package.json', server), '{"type":"module"}\n'),
  writeFile(new URL('wrangler.json', server), JSON.stringify({
    main: 'index.js',
    compatibility_date: '2026-11-08',
    assets: {
      directory: '../client',
      binding: 'ASSETS',
      html_handling: 'force-trailing-slash',
      not_found_handling: '404-page',
      run_worker_first: ['/api/leaderboard*'],
    },
  }, null, 2) + '\n'),
]);
