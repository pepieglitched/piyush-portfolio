import { MAX_RUN_TICKS, TICKS_PER_SECOND, replayRunner } from '../src/components/game/runner';

interface Statement {
  bind(...values: (string | number)[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
}

export interface LeaderboardEnv {
  DB?: { prepare(sql: string): Statement };
  LEADERBOARD_SIGNING_KEY?: string;
  LEADERBOARD_ORIGIN?: string;
  LEADERBOARD_TRUST_SITES_IDENTITY?: string;
}

type Run = { version: number; seed: number; nonce: string; issuedAt: number; actor: string };
type Score = { username: string; score: number };
type Submission = { username: string; token: string; jumps: number[]; endTick: number };

const endpoint = '/api/leaderboard';
const maxBodySize = 24_576;
const lifetimeMs = 2 * 60 * 60_000;
const runVersion = 1;
const tokenPattern = /^([A-Za-z0-9_-]{1,400})\.([A-Za-z0-9_-]{43})$/;
const namePattern = /^(?=.*[A-Za-z0-9])[A-Za-z0-9 _-]{3,20}$/;
const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

function reply(body: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return Response.json(body, { status, headers: { ...headers, ...extraHeaders } });
}

function failure(status: number, error: string, extraHeaders?: Record<string, string>) {
  return reply({ error }, status, extraHeaders);
}

function base64url(bytes: Uint8Array<ArrayBuffer>) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unbase64url(value: string) {
  return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
}

async function sign(key: CryptoKey, message: string) {
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(message))));
}

async function actorHash(request: Request, key: CryptoKey, trustSitesIdentity: boolean) {
  // Public Workers must ignore identity headers that any caller can supply.
  const userId = trustSitesIdentity ? request.headers.get('oai-authenticated-user-id') : null;
  const ip = request.headers.get('cf-connecting-ip');
  const identity = userId ? `user:${userId}` : ip ? `ip:${ip}` : 'anonymous';
  // Rate-limit identifiers and signatures are scoped to this deployment.
  return sign(key, `actor:${identity}`);
}

async function verifyRun(key: CryptoKey, token: string, actor: string, now: number): Promise<Run | null> {
  const match = tokenPattern.exec(token);
  if (!match) return null;
  const [, payload, signature] = match;
  try {
    const verified = await crypto.subtle.verify('HMAC', key, unbase64url(signature), encoder.encode(`run:${payload}`));
    if (!verified) return null;
    const run: Run = JSON.parse(decoder.decode(unbase64url(payload)));
    if (run.version !== runVersion || run.actor !== actor || !Number.isSafeInteger(run.issuedAt) ||
        now - run.issuedAt > lifetimeMs || run.issuedAt - now > 2_000) return null;
    return run;
  } catch {
    return null;
  }
}

async function reserveRequest(db: NonNullable<LeaderboardEnv['DB']>, actor: string, action: 'start' | 'post', now: number) {
  const minute = Math.floor(now / 60_000);
  const limit = action === 'start' ? 24 : 12;
  const row = await db.prepare(`
    INSERT INTO signal_run_rate_limits (actor, action, minute, requests)
    VALUES (?, ?, ?, 1)
    ON CONFLICT (actor, action) DO UPDATE SET
      minute = excluded.minute,
      requests = CASE WHEN minute = excluded.minute THEN requests + 1 ELSE 1 END
    WHERE minute < excluded.minute OR (minute = excluded.minute AND requests < ?)
    RETURNING requests
  `).bind(actor, action, minute, limit).first<{ requests: number }>();
  return row !== null;
}

async function getEntries(db: NonNullable<LeaderboardEnv['DB']>) {
  const { results } = await db.prepare(`
    SELECT username, score FROM signal_run_scores
    ORDER BY score DESC, finished_at ASC, nonce ASC
    LIMIT 10
  `).all<Score>();
  return results.map((row, index) => ({ rank: index + 1, ...row }));
}

class InputError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function readSubmission(request: Request): Promise<Submission> {
  const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') throw new InputError(415, 'Send the score as JSON.');
  if (Number(request.headers.get('content-length')) > maxBodySize) throw new InputError(413, 'Run replay is too large.');
  if (!request.body) throw new InputError(400, 'Run details are missing.');

  const reader = request.body.getReader();
  const bytes = new Uint8Array(maxBodySize);
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (length + value.length > maxBodySize) {
        void reader.cancel().catch(() => {});
        throw new InputError(413, 'Run replay is too large.');
      }
      bytes.set(value, length);
      length += value.length;
    }
  } finally {
    reader.releaseLock();
  }

  let input: Partial<Submission> | null;
  try {
    input = JSON.parse(decoder.decode(bytes.subarray(0, length)));
  } catch {
    throw new InputError(400, 'Run details are invalid.');
  }
  const username = typeof input?.username === 'string' ? input.username.trim() : '';
  if (!namePattern.test(username)) {
    throw new InputError(400, 'Enter a name with 3–20 characters. Use letters, numbers, spaces, hyphens, or underscores.');
  }
  const { token, jumps, endTick } = input ?? {};
  if (typeof token !== 'string' || !tokenPattern.test(token) || typeof endTick !== 'number' ||
      !Number.isInteger(endTick) || endTick < 1 || endTick > MAX_RUN_TICKS ||
      !Array.isArray(jumps) || jumps.length > 3_000 ||
      jumps.some((tick, index) => !Number.isInteger(tick) || tick <= (jumps[index - 1] ?? 0) || tick > endTick)) {
    throw new InputError(400, 'Run details are invalid.');
  }
  return { username, token, jumps, endTick };
}

export async function handleLeaderboard(request: Request, env: LeaderboardEnv) {
  const { pathname, origin } = new URL(request.url);
  const path = pathname.replace(/\/$/, '');
  const start = path === `${endpoint}/start`;
  if (!start && path !== endpoint) return failure(404, 'Leaderboard route not found.');
  const reading = !start && request.method === 'GET';
  if (!reading && request.method !== 'POST') {
    return failure(405, 'Method not allowed.', { Allow: start ? 'POST' : 'GET, POST' });
  }
  if (!reading && (request.headers.get('origin') !== (env.LEADERBOARD_ORIGIN || origin) ||
      request.headers.get('sec-fetch-site') === 'cross-site')) {
    return failure(403, 'Submit scores from the Signal Run page.');
  }

  const { DB: db, LEADERBOARD_SIGNING_KEY: secret } = env;
  if (!db || !secret || secret.length < 32) return failure(503, 'The global leaderboard is not configured.');
  try {
    if (reading) return reply({ entries: await getEntries(db) });
    const now = Date.now();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
    const actor = await actorHash(request, key, env.LEADERBOARD_TRUST_SITES_IDENTITY === 'true');
    if (!await reserveRequest(db, actor, start ? 'start' : 'post', now)) {
      return failure(429, 'Too many requests. Try again in a moment.', {
        'Retry-After': String(Math.ceil((60_000 - now % 60_000) / 1_000)),
      });
    }

    if (start) {
      const [seed] = crypto.getRandomValues(new Uint32Array(1));
      const run: Run = { version: runVersion, seed, nonce: crypto.randomUUID(), issuedAt: now, actor };
      const payload = base64url(encoder.encode(JSON.stringify(run)));
      const signature = await sign(key, `run:${payload}`);
      // Remove old rate buckets occasionally, without a timer or persistent raw identifiers.
      if ((seed & 127) === 0) {
        await db.prepare('DELETE FROM signal_run_rate_limits WHERE minute < ?').bind(Math.floor(now / 60_000) - 1440).all();
      }
      return reply({ token: `${payload}.${signature}`, seed });
    }

    const { username, token, jumps, endTick } = await readSubmission(request);
    const run = await verifyRun(key, token, actor, now);
    if (!run) return failure(400, 'This ranked run has expired or is invalid.');
    if (endTick / TICKS_PER_SECOND * 1_000 > now - run.issuedAt + 1_500) {
      return failure(400, 'Run duration does not match the replay.');
    }
    const result = replayRunner(run.seed, jumps, endTick);
    if (!result) return failure(400, 'This run could not be verified.');

    const saved = await db.prepare(`
      INSERT INTO signal_run_scores (nonce, username, score, finished_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (nonce) DO NOTHING
      RETURNING username, score
    `).bind(run.nonce, username, result.score, now).first<Score>();
    if (!saved) {
      const previous = await db.prepare('SELECT username, score FROM signal_run_scores WHERE nonce = ?').bind(run.nonce).first<Score>();
      if (previous?.username !== username || previous.score !== result.score) {
        return failure(409, 'This run already has a posted score.');
      }
    }
    return reply({ score: result.score, entries: await getEntries(db) }, saved ? 201 : 200);
  } catch (error) {
    if (error instanceof InputError) return failure(error.status, error.message);
    return failure(503, 'The global leaderboard is unavailable right now. Try again shortly.');
  }
}
