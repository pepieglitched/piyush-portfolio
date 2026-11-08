export type ControllerSpot = { x: number; y: number; size: number };

const edge = 16;
const clearance = 10;
const protectedElements = 'a, button, input, select, textarea, img, canvas, svg, [role="tablist"], [data-portrait-state]';

/** Sample occupied page space once per reveal opportunity. */
export function findControllerSpot(): ControllerSpot | null {
  const root = document.documentElement;
  const viewport = window.visualViewport;
  if (viewport && (viewport.scale > 1.05 || innerHeight - viewport.height > 90)) return null;

  const width = root.clientWidth;
  const height = Math.min(innerHeight, viewport?.height ?? innerHeight);
  const size = width < 700 ? 60 : 76;
  const main = document.querySelector('main');
  const header = document.querySelector('body > header');
  if (!main || width < 280 || height < 330) return null;

  const top = Math.max(edge, (header?.getBoundingClientRect().bottom ?? 0) + edge);
  const travelX = width - size - edge * 2;
  const travelY = height - size - top - edge;
  if (travelY <= 0) return null;

  const occupied: DOMRect[] = [];
  const isVisible = (rect: DOMRect) => rect.width > 1 && rect.height > 1 &&
    rect.bottom > 0 && rect.top < height && rect.right > 0 && rect.left < width;
  const range = document.createRange();
  const chapters = main.querySelectorAll(':scope > :is(div, section, footer)');

  for (const chapter of chapters) {
    if (!isVisible(chapter.getBoundingClientRect())) continue;
    for (const element of chapter.querySelectorAll(protectedElements)) {
      for (const rect of element.getClientRects()) if (isVisible(rect)) occupied.push(rect);
    }

    // Measure text lines, not their full-width containers, so editorial whitespace remains usable.
    const words = document.createTreeWalker(chapter, NodeFilter.SHOW_TEXT);
    while (words.nextNode()) {
      const node = words.currentNode;
      if (!node.textContent?.trim() || node.parentElement?.closest('script, style, noscript, [hidden], svg')) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) if (isVisible(rect)) occupied.push(rect);
    }
  }

  const free: ControllerSpot[] = [];
  for (const column of [0, .12, .25, .38, .5, .62, .75, .88, 1]) {
    for (const row of [0, .12, .24, .36, .48, .6, .72, .84, 1]) {
      const x = Math.round(edge + column * travelX);
      const y = Math.round(top + row * travelY);
      const overlaps = occupied.some(rect =>
        x - clearance < rect.right && x + size + clearance > rect.left &&
        y - clearance < rect.bottom && y + size + clearance > rect.top,
      );
      if (!overlaps) free.push({ x, y, size });
    }
  }
  return free[Math.floor(Math.random() * free.length)] ?? null;
}
