'use client';

import { useEffect, useId, useRef, type RefObject } from 'react';

const RIM_DEPTH = 13;
const FILTER_SCALE = 23;

function makeDisplacementMap(width: number, height: number, radius: number) {
  const resolution = Math.min(1, 1024 / width, 128 / height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * resolution));
  canvas.height = Math.max(1, Math.round(height * resolution));
  const context = canvas.getContext('2d');
  if (!context) return;

  const map = context.createImageData(canvas.width, canvas.height);
  const rim = Math.min(RIM_DEPTH, radius);
  for (let row = 0; row < map.height; row++) {
    const y = (row + .5) * height / map.height;
    const dy = y - Math.min(height - radius, Math.max(radius, y));
    for (let column = 0; column < map.width; column++) {
      const x = (column + .5) * width / map.width;
      const dx = x - Math.min(width - radius, Math.max(radius, x));
      const distance = Math.hypot(dx, dy);
      const depth = Math.max(0, Math.min(1, (distance - radius + rim) / rim));
      // Red and green encode inward sampling along the curved rim's normal.
      // A neutral center preserves alignment with the page behind it.
      const bend = distance ? 112 * depth * depth * (3 - 2 * depth) / distance : 0;
      const index = (row * map.width + column) * 4;
      map.data[index] = 128 - Math.round(dx * bend);
      map.data[index + 1] = 128 - Math.round(dy * bend);
      map.data[index + 2] = 128;
      map.data[index + 3] = 255;
    }
  }
  context.putImageData(map, 0, 0);
  return canvas.toDataURL('image/png');
}

/** The native glass styles remain the default until the displacement map is ready. */
export default function NavigationRefraction({ nav }: { nav: RefObject<HTMLElement | null> }) {
  const filterId = `navigation-refraction-${useId()}`;
  const mapImage = useRef<SVGFEImageElement>(null);

  useEffect(() => {
    const element = nav.current;
    const map = mapImage.current;
    const reference = `url("#${filterId}")`;
    // Parsing url() does not prove a browser can render SVG backdrop filters.
    const chromium = /\b(?:Chrome|Chromium|HeadlessChrome)\//.test(navigator.userAgent);
    if (!element || !map || !chromium || !CSS.supports('backdrop-filter', reference)) return;

    const desktop = window.matchMedia('(min-width: 1100px) and (hover: hover) and (pointer: fine)');
    let timer: number | undefined;
    let revision = 0;
    let previousGeometry = '';

    const reset = () => {
      element.removeAttribute('data-glass-refraction');
      element.style.removeProperty('--glass-refraction');
      map.removeAttribute('href');
      previousGeometry = '';
    };

    const refresh = () => {
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const radius = Math.min(width / 2, height / 2, parseFloat(getComputedStyle(element).borderTopLeftRadius));
      const geometry = `${width}:${height}:${radius}`;
      if (!width || !height || !(radius > 0) || geometry === previousGeometry) return;
      const current = ++revision;
      const source = makeDisplacementMap(width, height, radius);
      if (!source) { reset(); return; }

      const image = new Image();
      image.src = source;
      void image.decode().then(() => {
        if (revision !== current || !desktop.matches) return;
        // Numeric primitive dimensions align the map to this CSS filter surface.
        map.setAttribute('width', String(width));
        map.setAttribute('height', String(height));
        map.setAttribute('href', source);
        element.style.setProperty('--glass-refraction', reference);
        element.setAttribute('data-glass-refraction', 'true');
        previousGeometry = geometry;
      }, () => {
        if (revision === current) reset();
      });
    };

    const schedule = () => {
      window.clearTimeout(timer);
      ++revision;
      timer = window.setTimeout(refresh, 90);
    };
    const observer = new ResizeObserver(schedule);
    const update = () => {
      if (desktop.matches) {
        observer.observe(element, { box: 'border-box' });
        schedule();
      } else {
        observer.disconnect();
        window.clearTimeout(timer);
        ++revision;
        reset();
      }
    };
    desktop.addEventListener('change', update);
    update();
    return () => {
      observer.disconnect();
      desktop.removeEventListener('change', update);
      window.clearTimeout(timer);
      ++revision;
      reset();
    };
  }, [filterId, nav]);

  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
      <defs>
        <filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feImage ref={mapImage} x="0" y="0" preserveAspectRatio="none" result="rim" />
          <feDisplacementMap in="SourceGraphic" in2="rim" scale={FILTER_SCALE} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
