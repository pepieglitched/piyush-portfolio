import { handleLeaderboard, type LeaderboardEnv } from './leaderboard';

type Env = LeaderboardEnv & { ASSETS?: { fetch(request: Request): Promise<Response> } };

const worker = {
  fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url);
    if (/^\/api\/leaderboard(?:\/|$)/.test(pathname)) return handleLeaderboard(request, env);
    return env.ASSETS?.fetch(request) ?? new Response('Page not found.', { status: 404 });
  },
};

export default worker;
