export const TICKS_PER_SECOND = 60;
export const RUNNER_UNIT = 100;
export const MAX_RUN_TICKS = 108_000;
const START_SPEED = 360;
const MAX_SPEED = 880;
const JUMP_VELOCITY = 1015;
const GRAVITY = 38;
const BODY_RADIUS = 11 * RUNNER_UNIT;
const BOT_HEIGHT = 23 * RUNNER_UNIT;
const LOOK_AHEAD = 1650 * RUNNER_UNIT;

export type RunnerDeath = 'bot' | 'pit';
export type RunnerObstacle = { start: number; end: number; kind: RunnerDeath };
export type RunnerState = {
  tick: number;
  distance: number;
  altitude: number;
  velocity: number;
  speed: number;
  clears: number;
  score: number;
  death: RunnerDeath | null;
  obstacles: RunnerObstacle[];
  previousObstacle: RunnerObstacle | null;
  random: number;
  nextObstacle: number;
};

function randomBetween(state: RunnerState, low: number, high: number) {
  let seed = state.random;
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  state.random = seed >>> 0;
  return low + state.random % (high - low + 1);
}

function generateAhead(state: RunnerState) {
  while (state.nextObstacle < state.distance + LOOK_AHEAD) {
    const level = Math.min(16, Math.floor(state.tick / 480));
    const kind = state.nextObstacle > 420 * RUNNER_UNIT &&
      randomBetween(state, 1, 100) <= 28 + level ? 'pit' : 'bot';
    // Even the widest pit is shorter than one jump at its generated speed.
    const width = kind === 'bot' ? 32 :
      Math.min(77 + 3 * level + randomBetween(state, 0, 36), Math.floor(state.speed * 43 / RUNNER_UNIT) - 20);
    const start = state.nextObstacle;
    const end = start + width * RUNNER_UNIT;
    state.obstacles.push({ start, end, kind });
    // Give the player a full landing window before the next obstacle.
    const gap = Math.max(210 - level * 3, Math.ceil(state.speed * 58 / RUNNER_UNIT));
    state.nextObstacle = end + (gap + randomBetween(state, 90, 220)) * RUNNER_UNIT;
  }
}

export function createRunner(seed: number): RunnerState {
  const state: RunnerState = {
    tick: 0, distance: 0, altitude: 0, velocity: 0, speed: START_SPEED,
    clears: 0, score: 0, death: null, obstacles: [], previousObstacle: null,
    random: (seed >>> 0) || 0x9e3779b9, nextObstacle: 420 * RUNNER_UNIT,
  };
  generateAhead(state);
  return state;
}

/** Apply input at tick state.tick + 1. Return true only when a jump starts. */
export function stepRunner(state: RunnerState, jump: boolean): boolean {
  if (state.death) return false;
  const jumped = jump && state.altitude === 0;
  if (jumped) state.velocity = JUMP_VELOCITY;

  state.tick++;
  state.speed = Math.min(MAX_SPEED, START_SPEED + Math.floor(state.tick / 4));
  state.distance += state.speed;
  const previousAltitude = state.altitude;
  state.velocity -= GRAVITY;
  state.altitude += state.velocity;

  const abovePit = state.obstacles.some(obstacle =>
    obstacle.kind === 'pit' && state.distance > obstacle.start && state.distance < obstacle.end,
  );
  if (!abovePit && state.altitude <= 0 && previousAltitude >= 0) {
    state.altitude = 0;
    state.velocity = 0;
  }

  if (state.altitude < -20 * RUNNER_UNIT) {
    state.death = 'pit';
  } else if (state.obstacles.some(obstacle => obstacle.kind === 'bot' &&
      state.distance + BODY_RADIUS > obstacle.start && state.distance - BODY_RADIUS < obstacle.end &&
      state.altitude < BOT_HEIGHT)) {
    state.death = 'bot';
  }

  while (!state.death && state.obstacles[0] && state.distance - BODY_RADIUS > state.obstacles[0].end) {
    state.clears++;
    state.previousObstacle = state.obstacles.shift() ?? null;
  }
  generateAhead(state);
  state.score = Math.floor(state.tick / 6) + Math.floor(state.distance / (RUNNER_UNIT * 18)) + state.clears * 75;
  return jumped;
}

/** Recompute an entire ranked run from its seed and accepted one-based jump ticks. */
export function replayRunner(seed: number, jumps: number[], endTick: number): { score: number; death: RunnerDeath } | null {
  if (!Number.isInteger(endTick) || endTick < 1 || endTick > MAX_RUN_TICKS) return null;
  const state = createRunner(seed);
  let input = 0;
  for (let tick = 1; tick <= endTick; tick++) {
    const jump = jumps[input] === tick;
    const jumped = stepRunner(state, jump);
    if (jump && !jumped) return null;
    if (jump) input++;
    if (state.death) {
      return tick === endTick && input === jumps.length ? { score: state.score, death: state.death } : null;
    }
  }
  return null;
}
