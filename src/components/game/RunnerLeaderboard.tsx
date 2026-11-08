'use client';

import { useEffect, useRef, useState } from 'react';
import { loadLeaderboard, type LeaderboardEntry } from './leaderboard';
import styles from './SignalRun.module.scss';

export function useRunnerLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'offline'>('loading');
  const [revision, setRevision] = useState(0);
  const currentRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const request = new AbortController();
    currentRequest.current = request;
    const timer = window.setTimeout(() => request.abort('timeout'), 4500);
    let active = true;
    void loadLeaderboard(request.signal).then(results => {
      if (!active || request.signal.aborted) return;
      setEntries(results);
      setStatus('ready');
    }).catch(() => {
      if (active && (!request.signal.aborted || request.signal.reason === 'timeout')) setStatus('offline');
    }).finally(() => window.clearTimeout(timer));
    return () => { active = false; window.clearTimeout(timer); request.abort(); };
  }, [revision]);

  return {
    entries,
    status,
    refresh: () => {
      setStatus('loading');
      setRevision(value => value + 1);
    },
    update: (results: LeaderboardEntry[]) => {
      currentRequest.current?.abort();
      setEntries(results);
      setStatus('ready');
    },
  };
}

export default function RunnerLeaderboard({ entries, status, refresh }: ReturnType<typeof useRunnerLeaderboard>) {
  return (
    <section className={styles.leaderboard} aria-labelledby="runner-leaderboard" data-runner-leaderboard>
      <header>
        <div>
          <p className={styles.eyebrow}>SIGNAL RUN / TOP 10</p>
          <h2 id="runner-leaderboard">Leaderboard</h2>
        </div>
        <button type="button" onClick={refresh} disabled={status === 'loading'}>Refresh <span aria-hidden="true">↻</span></button>
      </header>
      {status === 'loading' && <p role="status">Loading scores…</p>}
      {status === 'offline' && <p role="status">{entries?.length ? 'Couldn’t refresh. Showing the last loaded scores.' : 'Leaderboard unavailable. You can still play and set a personal best.'}</p>}
      {status === 'ready' && entries?.length === 0 && <p role="status">No scores yet. Finish a ranked run to post the first one.</p>}
      {entries && entries.length > 0 && (
        <ol aria-label="Top ten ranked scores">
          {entries.slice(0, 10).map(entry => (
            <li key={entry.rank}>
              <span className={styles.rank} aria-label={`Rank ${entry.rank}`}>{String(entry.rank).padStart(2, '0')}</span>
              <span>{entry.username}</span>
              <strong>{entry.score.toLocaleString('en-IN')}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
