import { RUNNER_UNIT, type RunnerState } from './runner';

const FLOOR = 310;
const editorial = {
  background: '#101216', grid: '#23262d', skyline: '#1c2028', circuit: '#4568ff',
  floor: '#292d35', trace: '#171a20', accent: '#ed3345',
};
const cyber = {
  background: '#071020', grid: '#172c4d', skyline: '#0e1d37', circuit: '#6bb2ff',
  floor: '#183457', trace: '#101e38', accent: '#64a9ff',
};

export function drawRunner(context: CanvasRenderingContext2D, state: RunnerState, width: number, scale: number, cyberTheme: boolean) {
  const palette = cyberTheme ? cyber : editorial;
  const px = Math.min(110, Math.round(width * .23));
  const worldX = state.distance / RUNNER_UNIT;
  const camera = worldX - px;
  const py = Math.round(FLOOR - state.altitude / RUNNER_UNIT);
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.fillStyle = palette.background;
  context.fillRect(0, 0, width, 400);
  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  context.beginPath();
  for (let x = -((camera * .18) % 60) - 60; x < width; x += 60) {
    context.moveTo(x, 0);
    context.lineTo(x, FLOOR);
  }
  for (let y = 10; y < FLOOR; y += 60) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();

  // The skyline scrolls at a fraction of the floor speed.
  for (let i = -1; i < Math.ceil(width / 170) + 1; i++) {
    const x = i * 170 - camera * .12 % 170;
    const top = 190 - (i % 3) * 28;
    context.fillStyle = palette.skyline;
    context.fillRect(x, top, 90, FLOOR - top);
    context.fillStyle = palette.circuit;
    context.fillRect(x + 12, top + 25, 4, 4);
  }

  function road(from: number, to: number) {
    if (to <= from) return;
    context.fillStyle = palette.floor;
    context.fillRect(from, FLOOR, to - from, 90);
    context.fillStyle = '#f3f0e8';
    context.fillRect(from, FLOOR, to - from, 2);
    context.fillStyle = palette.trace;
    context.save();
    context.beginPath();
    context.rect(from, FLOOR, to - from, 90);
    context.clip();
    for (let x = Math.floor((camera + from) / 48) * 48 - camera; x < to; x += 48) {
      context.fillRect(x, FLOOR + 14, 34, 6);
      context.fillRect(x + 16, FLOOR + 40, 30, 4);
    }
    context.restore();
  }

  let nextFloor = 0;
  for (let index = -1; index < state.obstacles.length; index++) {
    const obstacle = index === -1 ? state.previousObstacle : state.obstacles[index];
    if (!obstacle) continue;
    const start = obstacle.start / RUNNER_UNIT - camera;
    const end = obstacle.end / RUNNER_UNIT - camera;
    if (end < 0 || start > width) continue;
    if (obstacle.kind === 'pit') {
      road(nextFloor, Math.min(width, start));
      nextFloor = Math.max(0, end);
      context.fillStyle = palette.accent;
      context.fillRect(start - 4, FLOOR + 2, 4, 13);
      context.fillRect(end, FLOOR + 2, 4, 13);
      continue;
    }
    const x = Math.round((start + end) / 2);
    // Original pixel-art bug sprite, now an Error Bot.
    context.fillStyle = '#ed3345';
    context.fillRect(x - 13, FLOOR - 20, 26, 18);
    context.fillRect(x - 19, FLOOR - 25, 5, 5);
    context.fillRect(x + 14, FLOOR - 25, 5, 5);
    context.fillRect(x - 19, FLOOR - 8, 5, 8);
    context.fillRect(x + 14, FLOOR - 8, 5, 8);
    context.fillStyle = '#0b0c0f';
    context.fillRect(x - 8, FLOOR - 16, 5, 5);
    context.fillRect(x + 3, FLOOR - 16, 5, 5);
  }
  road(nextFloor, width);

  // Original 24 × 36 robot and its antenna.
  context.fillStyle = '#f3f0e8';
  context.fillRect(px - 10, py - 36, 20, 16);
  context.fillRect(px - 8, py - 18, 16, 13);
  context.fillRect(px - 15, py - 17, 5, 12);
  context.fillRect(px + 10, py - 17, 5, 12);
  context.fillRect(px - 8, py - 4, 5, 4);
  context.fillRect(px + 3, py - 4, 5, 4);
  context.fillRect(px - 2, py - 42, 4, 6);
  context.fillStyle = '#ed3345';
  context.fillRect(px - 3, py - 45, 6, 4);
  context.fillStyle = '#0b0c0f';
  context.fillRect(px - 7, py - 31, 14, 7);
  context.fillStyle = palette.circuit;
  context.fillRect(px - 5, py - 29, 3, 3);
  context.fillRect(px + 2, py - 29, 3, 3);
  context.fillStyle = '#ed3345';
  context.fillRect(px - 3, py - 15, 6, 5);

  context.font = '10px monospace';
  context.textAlign = 'left';
  context.fillStyle = '#a5a7ae';
  context.fillText('SIGNAL RUN / ENDLESS FIELD', 24, 27);
  context.fillStyle = palette.circuit;
  context.fillText(`X:${String(Math.floor(worldX)).padStart(5, '0')}`, 24, 45);
  context.fillStyle = '#a5a7ae';
  context.textAlign = 'right';
  context.fillText(`PACE ×${(state.speed / 360).toFixed(2)}`, width - 24, 350);
}
