export type LeaderboardEntry = { rank: number; username: string; score: number };
export type RankedRun = { token: string; seed: number };

async function leaderboardRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { cache: 'no-store', ...init });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) {
    throw new Error(typeof data?.error === 'string' ? data.error : 'The leaderboard is unavailable right now.');
  }
  return data as T;
}

export async function loadLeaderboard(signal: AbortSignal) {
  const { entries } = await leaderboardRequest<{ entries: LeaderboardEntry[] }>('/api/leaderboard', { signal });
  if (!Array.isArray(entries)) throw new Error('The leaderboard is unavailable right now.');
  return entries;
}

export async function startRankedRun(): Promise<RankedRun> {
  const run = await leaderboardRequest<RankedRun>('/api/leaderboard/start', {
    method: 'POST', signal: AbortSignal.timeout(1200),
  });
  if (!Number.isInteger(run.seed) || typeof run.token !== 'string' || !run.token) {
    throw new Error('The leaderboard is unavailable right now.');
  }
  return run;
}

export function postRankedScore(username: string, token: string, jumps: number[], endTick: number) {
  return leaderboardRequest<{ score: number; entries: LeaderboardEntry[] }>('/api/leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, token, jumps, endTick }),
    signal: AbortSignal.timeout(8000),
  });
}

export function validUsername(value: string) {
  return /^[a-z0-9 _-]{3,20}$/i.test(value) && /[a-z0-9]/i.test(value);
}
