import { readFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';

// A local adapter for tests. The production Worker uses its D1 binding.
export async function openLeaderboardTestDb(filename = ':memory:') {
  const migration = await readFile(new URL('../drizzle/0000_signal_run_leaderboard.sql', import.meta.url), 'utf8');
  const sqlite = new DatabaseSync(filename);
  if (!sqlite.prepare("SELECT 1 FROM sqlite_schema WHERE name = 'signal_run_scores'").get()) sqlite.exec(migration);
  return {
    db: {
      prepare(sql) {
        const query = sqlite.prepare(sql);
        const statement = (values) => ({
          bind: (...bound) => statement(bound),
          first: async () => query.get(...values) ?? null,
          all: async () => ({ results: query.all(...values) }),
        });
        return statement([]);
      },
    },
    close: () => sqlite.close(),
  };
}
