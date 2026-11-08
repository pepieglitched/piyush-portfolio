import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import ts from 'typescript';
import { openLeaderboardTestDb } from './leaderboard-test-db.mjs';

const root = new URL('../', import.meta.url);
const toModule = (source) => {
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
};
const runnerUrl = toModule(await readFile(new URL('src/components/game/runner.ts', root), 'utf8'));
const apiSource = await readFile(new URL('worker/leaderboard.ts', root), 'utf8');
const { handleLeaderboard } = await import(toModule(apiSource.replace('../src/components/game/runner', runnerUrl)));
const { createRunner, stepRunner, RUNNER_UNIT, TICKS_PER_SECOND } = await import(runnerUrl);
const origin = 'https://example.test';
const signingKey = () => randomBytes(32).toString('base64url');

function request(path, { method = 'GET', actor = 'tester', body, requestOrigin = origin, headers } = {}) {
  return new Request(origin + '/api/leaderboard' + path, {
    method,
    headers: {
      'oai-authenticated-user-id': actor,
      ...(method === 'POST' ? { origin: requestOrigin } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...headers,
    },
    body: body && (typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

function noJumpRun(seed) {
  const runner = createRunner(seed);
  while (!runner.death && runner.tick < 1_200) stepRunner(runner, false);
  assert.ok(runner.death, 'The unattended runner should hit its first obstacle.');
  return runner;
}

test('A verified score persists and a one-use token is idempotent for the same submission', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'signal-run-db-'));
  const file = join(directory, 'scores.sqlite');
  const now = Date.now;
  let clock = now();
  Date.now = () => clock;
  const env = { LEADERBOARD_SIGNING_KEY: signingKey() };
  let database = await openLeaderboardTestDb(file);
  context.after(async () => {
    Date.now = now;
    database.close();
    await rm(file, { force: true });
    await rmdir(directory);
  });
  const call = (path, options) => handleLeaderboard(request(path, options), { ...env, DB: database.db });
  assert.deepEqual(await (await call('')).json(), { entries: [] });

  const started = await call('/start', { method: 'POST' });
  assert.equal(started.status, 200);
  const { token, seed } = await started.json();
  const runner = noJumpRun(seed);
  const body = { username: '  Pixel Pilot  ', token, endTick: runner.tick, jumps: [], score: 999_999_999 };
  assert.equal((await call('', { method: 'POST', body })).status, 400, 'An instantly submitted replay must fail its wall-time check.');
  clock += runner.tick / TICKS_PER_SECOND * 1000 + 1_000;
  assert.equal((await call('', { method: 'POST', body, actor: 'different-player' })).status, 400);
  const [payload, signature] = token.split('.');
  const tampered = JSON.parse(Buffer.from(payload, 'base64url'));
  tampered.seed = (seed + 1) >>> 0;
  assert.equal((await call('', { method: 'POST', body: { ...body, token: `${Buffer.from(JSON.stringify(tampered)).toString('base64url')}.${signature}` } })).status, 400);
  assert.equal((await call('', { method: 'POST', body: { ...body, endTick: runner.tick + 1 } })).status, 400);
  assert.equal((await call('', { method: 'POST', body: { ...body, username: '<svg>' } })).status, 400);

  const stored = await call('', { method: 'POST', body });
  assert.equal(stored.status, 201);
  assert.equal(stored.headers.get('cache-control'), 'no-store');
  const posted = { rank: 1, username: 'Pixel Pilot', score: runner.score };
  assert.deepEqual(await stored.json(), { score: runner.score, entries: [posted] });
  assert.equal((await call('', { method: 'POST', body })).status, 200);
  assert.equal((await call('', { method: 'POST', body: { ...body, username: 'Other Pilot' } })).status, 409);
  clock += 2 * 60 * 60_000;
  assert.equal((await call('', { method: 'POST', body })).status, 400, 'Expired proof cannot be reused.');
  database.close();
  database = await openLeaderboardTestDb(file);
  assert.deepEqual(await (await call('')).json(), { entries: [posted] });
});

test('A jump that clears an obstacle is replayed and scores more than an unattended run', async (context) => {
  const database = await openLeaderboardTestDb();
  context.after(database.close);
  const now = Date.now;
  let clock = now();
  Date.now = () => clock;
  context.after(() => { Date.now = now; });
  const env = { DB: database.db, LEADERBOARD_SIGNING_KEY: signingKey() };
  const started = await handleLeaderboard(request('/start', { method: 'POST' }), env);
  const { token, seed } = await started.json();
  const runner = createRunner(seed);
  const jumpAt = runner.obstacles[0].start - 85 * RUNNER_UNIT;
  const jumps = [];
  while (!runner.death && runner.tick < 1_200) {
    if (stepRunner(runner, jumps.length === 0 && runner.distance >= jumpAt)) jumps.push(runner.tick);
  }
  assert.equal(jumps.length, 1);
  assert.equal(runner.clears, 1);
  assert.ok(runner.death);
  assert.ok(runner.score > noJumpRun(seed).score);
  clock += runner.tick / TICKS_PER_SECOND * 1000 + 1_000;
  const body = { username: 'Pixel Pilot', token, endTick: runner.tick, jumps };
  const scores = await Promise.all([1, 2].map(() => handleLeaderboard(request('', { method: 'POST', body }), env)));
  assert.deepEqual(scores.map(({ status }) => status).sort(), [200, 201]);
  assert.deepEqual(await scores[0].json(), { score: runner.score, entries: [{ rank: 1, username: 'Pixel Pilot', score: runner.score }] });
});

test('Ranking returns at most ten runs with stable score and time ordering', async (context) => {
  const database = await openLeaderboardTestDb();
  context.after(database.close);
  for (let index = 0; index < 12; index++) {
    await database.db.prepare('INSERT INTO signal_run_scores VALUES (?, ?, ?, ?) RETURNING score')
      .bind(String(index), `Pilot ${index}`, Math.floor(index / 2), index).first();
  }
  const response = await handleLeaderboard(request('/'), { DB: database.db, LEADERBOARD_SIGNING_KEY: signingKey() });
  const { entries } = await response.json();
  assert.deepEqual(entries, [10, 11, 8, 9, 6, 7, 4, 5, 2, 3].map((index, rank) => ({
    rank: rank + 1, username: `Pilot ${index}`, score: Math.floor(index / 2),
  })));
});

test('Write requests enforce same-origin, body limits, and concurrent request limits', async (context) => {
  const database = await openLeaderboardTestDb();
  context.after(database.close);
  const now = Date.now;
  Date.now = () => 1_800_000_000_000;
  context.after(() => { Date.now = now; });
  const env = { DB: database.db, LEADERBOARD_SIGNING_KEY: signingKey() };
  const call = (path, options) => handleLeaderboard(request(path, options), env);
  assert.equal((await handleLeaderboard(request(''), {})).status, 503);
  assert.equal((await call('/start', { method: 'POST', requestOrigin: 'https://other.test' })).status, 403);
  assert.equal((await call('/start', { method: 'POST', headers: { 'sec-fetch-site': 'cross-site' } })).status, 403);
  assert.equal((await call('/start')).status, 405);
  assert.equal((await call('', { method: 'POST', body: 'x'.repeat(25_000) })).status, 413);
  assert.equal((await call('', { method: 'POST', headers: { 'content-type': 'text/plain' } })).status, 415);
  const responses = await Promise.all(Array.from({ length: 25 }, () => call('/start', { method: 'POST' })));
  assert.equal(responses.filter(({ status }) => status === 200).length, 24);
  const limited = responses.find(({ status }) => status === 429);
  assert.ok(Number(limited?.headers.get('retry-after')) > 0);
  assert.equal((await call('/start', { method: 'POST', actor: 'another-player' })).status, 200);
});
