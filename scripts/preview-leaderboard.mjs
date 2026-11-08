import { randomBytes } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import serve from 'serve-handler';
import worker from '../dist/server/index.js';
import { openLeaderboardTestDb } from './leaderboard-test-db.mjs';

const runtime = new URL('../.sites-runtime/', import.meta.url);
const client = fileURLToPath(new URL('../dist/client/', import.meta.url));
const port = Number(process.env.PORT ?? 3000);
const hostname = '127.0.0.1';
const origin = `http://${hostname}:${port}`;

await mkdir(runtime, { recursive: true });
const filename = process.env.LEADERBOARD_PREVIEW_IN_MEMORY === '1' ? ':memory:' :
  fileURLToPath(new URL('preview-leaderboard.sqlite', runtime));
const { db, close } = await openLeaderboardTestDb(filename);
const env = { DB: db, LEADERBOARD_SIGNING_KEY: randomBytes(48).toString('hex') };

const server = createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url, origin);
    if (!/^\/api\/leaderboard(?:\/|$)/.test(url.pathname)) {
      await serve(incoming, outgoing, { public: client, trailingSlash: true, directoryListing: false });
      return;
    }
    const method = incoming.method;
    const request = new Request(url, {
      method,
      headers: incoming.headers,
      ...(method !== 'GET' && method !== 'HEAD' && { body: Readable.toWeb(incoming), duplex: 'half' }),
    });
    const response = await worker.fetch(request, env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    if (outgoing.headersSent) outgoing.destroy();
    else {
      outgoing.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      outgoing.end('Local preview could not complete the request.');
    }
  }
});

server.listen(port, hostname, () => console.log(`Local: ${origin}/`));
server.once('close', close);
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
