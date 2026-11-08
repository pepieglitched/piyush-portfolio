CREATE TABLE signal_run_scores (
  nonce TEXT PRIMARY KEY NOT NULL,
  username TEXT NOT NULL CHECK (length(username) BETWEEN 3 AND 20),
  score INTEGER NOT NULL CHECK (score >= 0),
  finished_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX signal_run_scores_ranking ON signal_run_scores (score DESC, finished_at ASC, nonce ASC);
--> statement-breakpoint
CREATE TABLE signal_run_rate_limits (
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('start', 'post')),
  minute INTEGER NOT NULL,
  requests INTEGER NOT NULL,
  PRIMARY KEY (actor, action)
);
--> statement-breakpoint
CREATE INDEX signal_run_rate_limits_minute ON signal_run_rate_limits (minute);
