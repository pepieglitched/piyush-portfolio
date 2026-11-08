'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { subscribeTheme } from '@/lib/theme';
import styles from './InteractivePortrait.module.scss';

const DENSITY = [".:`'", '-_,;', '/\\(){}[]', '!?<>+=01', '%&08Q#@MW'];
const GLYPHS = DENSITY.join('');
const ATLAS_CELL = 32;
type Cell = { x: number; y: number; opacity: number; tone: number; glyph: number; accent: boolean };
type Point = { x: number; y: number };

/** Rasterize the full silhouette once for each size and palette. CSS animates the reveal. */
class PortraitRaster {
  private readonly context: CanvasRenderingContext2D;
  private readonly atlas = document.createElement('canvas');
  private cells: Cell[] = [];
  private alpha = new Uint8ClampedArray();
  private columns = 0;
  private rows = 0;
  private palette = '';
  private paintKey = '';
  private box = { x: 0, y: 0, width: 0, height: 0 };

  constructor(private readonly canvas: HTMLCanvasElement, private readonly source: HTMLImageElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    this.context = context;
  }

  private sample(columns: number) {
    const rows = Math.round(columns * this.source.naturalHeight / this.source.naturalWidth * .82);
    const sampler = document.createElement('canvas');
    sampler.width = columns;
    sampler.height = rows;
    const context = sampler.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas unavailable');
    context.drawImage(this.source, 0, 0, columns, rows);
    const pixels = context.getImageData(0, 0, columns, rows).data;
    const alpha = new Uint8ClampedArray(columns * rows);
    const cells: Cell[] = [];
    let hasTransparency = false;

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const index = row * columns + column;
        const offset = index * 4;
        const coverage = pixels[offset + 3];
        alpha[index] = coverage;
        if (coverage < 22) {
          hasTransparency = true;
          continue;
        }

        const luminance = (pixels[offset] * .2126 + pixels[offset + 1] * .7152 + pixels[offset + 2] * .0722) / 255;
        const tone = Math.pow(1 - luminance, .82);
        const band = DENSITY[Math.min(DENSITY.length - 1, Math.floor(tone * DENSITY.length))];
        const seed = (Math.imul(column + 1, 73856093) ^ Math.imul(row + 1, 19349663)) >>> 0;
        cells.push({
          x: column + .5,
          y: row + .5,
          tone,
          opacity: coverage / 255 * (.31 + tone * .69),
          glyph: GLYPHS.indexOf(band[seed % band.length]),
          accent: tone > .35 && seed % 97 === 0,
        });
      }
    }

    if (!hasTransparency || !cells.length) throw new Error('Portrait silhouette unavailable');
    this.columns = columns;
    this.rows = rows;
    this.alpha = alpha;
    this.cells = cells;
  }

  private buildAtlas(ink: string, accent: string) {
    const palette = ink + accent;
    if (this.palette === palette) return;
    this.atlas.width = GLYPHS.length * ATLAS_CELL;
    this.atlas.height = ATLAS_CELL * 2;
    const context = this.atlas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.font = '700 28px monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    [ink, accent].forEach((color, row) => {
      context.fillStyle = color;
      Array.from(GLYPHS).forEach((glyph, column) => {
        context.fillText(glyph, (column + .5) * ATLAS_CELL, (row + .5) * ATLAS_CELL);
      });
    });
    this.palette = palette;
  }

  paint(width: number, height: number, ink: string, accent: string) {
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, 1200 / Math.max(width, height));
    const key = [width, height, ratio, ink, accent].join(':');
    if (this.paintKey === key) return;

    const fit = Math.min(width / this.source.naturalWidth, height / this.source.naturalHeight);
    const imageWidth = this.source.naturalWidth * fit;
    const imageHeight = this.source.naturalHeight * fit;
    const box = { x: (width - imageWidth) / 2, y: height - imageHeight, width: imageWidth, height: imageHeight };
    const columns = Math.min(128, Math.max(54, Math.round(imageWidth / 5.35)));
    if (columns !== this.columns) this.sample(columns);
    this.buildAtlas(ink, accent);
    this.box = box;

    const canvas = this.canvas;
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const context = this.context;
    context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
    const stepX = imageWidth / columns;
    const stepY = imageHeight / this.rows;

    for (const cell of this.cells) {
      const glyphWidth = stepX * (1.16 + cell.tone * .48);
      const glyphHeight = stepY * (1.04 + cell.tone * .15);
      context.globalAlpha = cell.opacity;
      context.drawImage(
        this.atlas,
        cell.glyph * ATLAS_CELL, cell.accent ? ATLAS_CELL : 0, ATLAS_CELL, ATLAS_CELL,
        box.x + cell.x * stepX - glyphWidth / 2, box.y + cell.y * stepY - glyphHeight / 2,
        glyphWidth, glyphHeight,
      );
    }

    // Constrain even edge glyphs to the original photograph's alpha matte.
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(this.source, box.x, box.y, box.width, box.height);
    context.globalCompositeOperation = 'source-over';
    this.paintKey = key;
  }

  hitTest(x: number, y: number) {
    const box = this.box;
    const column = (x - box.x) / box.width;
    const row = (y - box.y) / box.height;
    if (!(column >= 0 && column < 1 && row >= 0 && row < 1)) return false;
    return this.alpha[Math.floor(row * this.rows) * this.columns + Math.floor(column * this.columns)] > 38;
  }
}

export default function InteractivePortrait() {
  const rootRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [full, setFull] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const source = imageRef.current;
    const canvas = canvasRef.current;
    const button = buttonRef.current;
    if (!root || !source || !canvas || !button) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let renderer: PortraitRaster | null = null;
    let preparation: Promise<boolean> | undefined;
    let pointer: Point | null = null;
    let frame = 0;
    let showing = false;
    let pinned = false;

    const paint = () => {
      const style = getComputedStyle(root);
      renderer?.paint(root.clientWidth, root.clientHeight, style.getPropertyValue('--ink').trim() || '#0b0c0f',
        style.getPropertyValue('--red-text').trim() || '#bf2434');
    };

    const update = () => {
      frame = 0;
      if (!renderer || disposed) return;
      let overPortrait = false;
      if (pointer && !pinned && !reduced.matches && !document.hidden) {
        const bounds = root.getBoundingClientRect();
        overPortrait = renderer.hitTest(pointer.x - bounds.left, pointer.y - bounds.top);
      }
      const visible = pinned || overPortrait;
      if (visible === showing) return;
      showing = visible;
      setEngaged(visible);
    };

    function schedule() {
      if (!frame && renderer && !disposed) frame = requestAnimationFrame(update);
    }

    const prepare = () => {
      if (renderer) return Promise.resolve(true);
      if (!preparation) {
        // Decode and sample the responsive bitmap already on the page.
        preparation = source.decode().then(() => {
          if (disposed) return false;
          renderer = new PortraitRaster(canvas, source);
          paint();
          root.setAttribute('data-portrait-ready', 'true');
          schedule();
          return true;
        }).catch(() => {
          renderer = null;
          if (!disposed) setUnavailable(true);
          return false;
        });
      }
      return preparation;
    };

    function track(event: PointerEvent) {
      if (event.pointerType === 'touch' || reduced.matches || pinned) return;
      if (event.target instanceof Element && event.target.closest('button')) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (renderer) schedule();
      else void prepare();
    }

    function leave() {
      pointer = null;
      schedule();
    }

    function scroll() {
      if (pointer) schedule();
    }

    async function toggle() {
      if (!await prepare() || disposed) return;
      pinned = !pinned;
      pointer = null;
      setFull(pinned);
      schedule();
    }

    function resize() {
      if (!renderer) return;
      paint();
      schedule();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(root);
    root.addEventListener('pointerenter', track);
    root.addEventListener('pointermove', track, { passive: true });
    root.addEventListener('pointerleave', leave);
    root.addEventListener('pointercancel', leave);
    button.addEventListener('click', toggle);
    window.addEventListener('scroll', scroll, { passive: true });
    const unsubscribeTheme = subscribeTheme(resize);
    document.addEventListener('visibilitychange', leave);
    reduced.addEventListener('change', leave);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      root.removeEventListener('pointerenter', track);
      root.removeEventListener('pointermove', track);
      root.removeEventListener('pointerleave', leave);
      root.removeEventListener('pointercancel', leave);
      button.removeEventListener('click', toggle);
      window.removeEventListener('scroll', scroll);
      unsubscribeTheme();
      document.removeEventListener('visibilitychange', leave);
      reduced.removeEventListener('change', leave);
      root.removeAttribute('data-portrait-ready');
    };
  }, []);

  return <div ref={rootRef} className={styles.portrait} data-portrait-state={engaged ? 'code' : 'photo'} data-portrait-full={full ? 'true' : 'false'}>
    <Image ref={imageRef} className={styles.image} src="/images/hero-transparent.png" alt="Piyush Rajput wearing sunglasses and a black shirt, in an original black-and-white halftone portrait" width={1145} height={1374} sizes="(max-width:460px) 88vw, (max-width:700px) 425px, (min-width:1700px) 775px, 52vw" priority fetchPriority="high"/>
    <canvas ref={canvasRef} className={styles.canvas} data-portrait-canvas aria-hidden="true"/>
    <button ref={buttonRef} className={styles.toggle} type="button" aria-label="Explore portrait as code" aria-pressed={full} disabled={unavailable}><span aria-hidden="true">&lt;/&gt;</span>{full ? 'RETURN TO PORTRAIT' : 'EXPLORE AS CODE'}<span aria-hidden="true">{full ? '−' : '+'}</span></button>
    <span className="sr-only" role="status">{unavailable ? 'The original portrait is displayed.' : full ? 'The full portrait is shown in ASCII. Press again to return to the photograph.' : 'Hover over the portrait, or use Explore portrait as code.'}</span>
  </div>;
}
