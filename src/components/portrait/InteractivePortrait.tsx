'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import styles from './InteractivePortrait.module.scss';

const MAX_COLUMNS = 90;
const GLYPHS = '01{}[]<>/\\=+*;:$!?_#()return.const';
const MAX_FPS = 40;

type Cell = { x: number; y: number; alpha: number; tone: number; seed: number };
type Point = { x: number; y: number };

/** Pixel work is sampled once. Only a small compositing pass runs while the pointer settles. */
class PortraitRenderer {
  private context: CanvasRenderingContext2D;
  private letters: HTMLCanvasElement;
  private letterContext: CanvasRenderingContext2D;
  private mask: HTMLCanvasElement;
  private maskContext: CanvasRenderingContext2D;
  private atlas: HTMLCanvasElement;
  private cells: Cell[] = [];
  private alpha: Uint8ClampedArray;
  private rows: number;
  private columns: number;
  private width = 0;
  private height = 0;
  private ratio = 1;
  private imageBounds = { x: 0, y: 0, width: 0, height: 0 };

  constructor(private canvas: HTMLCanvasElement, private source: HTMLImageElement, displayWidth: number) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    this.context = context;
    this.letters = document.createElement('canvas');
    this.mask = document.createElement('canvas');
    this.atlas = document.createElement('canvas');
    const letterContext = this.letters.getContext('2d');
    const maskContext = this.mask.getContext('2d');
    if (!letterContext || !maskContext) throw new Error('Canvas unavailable');
    this.letterContext = letterContext;
    this.maskContext = maskContext;
    // Keep the characters legible on phones without increasing desktop pixel work.
    this.columns = Math.min(MAX_COLUMNS, Math.max(46, Math.round(displayWidth / 7.5)));
    const columns = this.columns;
    this.rows = Math.round(columns * source.naturalHeight / source.naturalWidth);
    const sample = document.createElement('canvas');
    sample.width = columns;
    sample.height = this.rows;
    const sampler = sample.getContext('2d', { willReadFrequently: true });
    if (!sampler) throw new Error('Canvas unavailable');
    sampler.drawImage(source, 0, 0, columns, this.rows);
    const pixels = sampler.getImageData(0, 0, columns, this.rows).data;
    this.alpha = new Uint8ClampedArray(columns * this.rows);
    let transparentSamples = 0;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < columns; x++) {
        const index = y * columns + x;
        const offset = index * 4;
        const alpha = pixels[offset + 3];
        this.alpha[index] = alpha;
        if (alpha < 22) { transparentSamples++; continue; }
        const luminance = (pixels[offset] * .2126 + pixels[offset + 1] * .7152 + pixels[offset + 2] * .0722) / 255;
        this.cells.push({ x: (x + .5) / columns, y: (y + .5) / this.rows, alpha: alpha / 255, tone: 1 - luminance, seed: (x * 37 + y * 71) >>> 0 });
      }
    }
    // A missing matte must fall back to the photograph, never a rectangular code field.
    if (!transparentSamples || !this.cells.length) throw new Error('Portrait silhouette unavailable');
    // A fixed atlas avoids thousands of fillText calls or font measurements per frame.
    const atlasCell = 24;
    this.atlas.width = GLYPHS.length * atlasCell;
    this.atlas.height = atlasCell * 2;
    const atlasContext = this.atlas.getContext('2d');
    if (!atlasContext) throw new Error('Canvas unavailable');
    atlasContext.font = '20px monospace';
    atlasContext.textAlign = 'center';
    atlasContext.textBaseline = 'middle';
    for (let row = 0; row < 2; row++) {
      atlasContext.fillStyle = row ? '#bf2434' : '#0b0c0f';
      for (let i = 0; i < GLYPHS.length; i++) atlasContext.fillText(GLYPHS[i], i * atlasCell + atlasCell / 2, row * atlasCell + atlasCell / 2);
    }
    sample.width = sample.height = 0;
  }

  resize(width: number, height: number) {
    width = Math.max(1, width);
    height = Math.max(1, height);
    const ratio = Math.min(window.devicePixelRatio || 1, 1.35, 1100 / Math.max(width, height));
    if (this.width === width && this.height === height && this.ratio === ratio) return;
    this.width = width;
    this.height = height;
    this.ratio = ratio;
    const backingWidth = Math.max(1, Math.round(width * this.ratio));
    const backingHeight = Math.max(1, Math.round(height * this.ratio));
    [this.canvas, this.letters, this.mask].forEach(canvas => { canvas.width = backingWidth; canvas.height = backingHeight; });
    const fit = Math.min(width / this.source.naturalWidth, height / this.source.naturalHeight);
    const imageWidth = this.source.naturalWidth * fit;
    const imageHeight = this.source.naturalHeight * fit;
    this.imageBounds = { x: (width - imageWidth) / 2, y: height - imageHeight, width: imageWidth, height: imageHeight };
  }

  hitTest(point: Point) {
    const bounds = this.imageBounds;
    const x = (point.x - bounds.x) / bounds.width;
    const y = (point.y - bounds.y) / bounds.height;
    if (x < 0 || y < 0 || x >= 1 || y >= 1) return false;
    return this.alpha[Math.floor(y * this.rows) * this.columns + Math.floor(x * this.columns)] > 38;
  }

  draw(point: Point, strength: number, full: boolean, time: number) {
    const { width, height, ratio, imageBounds: bounds } = this;
    const context = this.context;
    const letters = this.letterContext;
    const mask = this.maskContext;
    [context, letters, mask].forEach(layer => {
      layer.setTransform(ratio, 0, 0, ratio, 0, 0);
      layer.globalCompositeOperation = 'source-over';
      layer.globalAlpha = 1;
      layer.clearRect(0, 0, width, height);
    });
    context.drawImage(this.source, bounds.x, bounds.y, bounds.width, bounds.height);
    if (strength < .001) return;

    const radius = Math.max(92, Math.min(185, bounds.width * .28));
    if (full) mask.fillStyle = `rgba(0,0,0,${strength})`;
    else {
      const gradient = mask.createRadialGradient(point.x, point.y, radius * .17, point.x, point.y, radius);
      gradient.addColorStop(0, `rgba(0,0,0,${strength})`);
      gradient.addColorStop(.58, `rgba(0,0,0,${strength * .93})`);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      mask.fillStyle = gradient;
    }
    mask.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'destination-out';
    context.drawImage(this.mask, 0, 0, width, height);
    context.globalCompositeOperation = 'source-over';

    const stepX = bounds.width / this.columns;
    const stepY = bounds.height / this.rows;
    const glyphWidth = stepX * 1.05;
    const glyphHeight = stepY * 1.14;
    const phase = Math.floor(time / 140);
    for (const cell of this.cells) {
      const x = bounds.x + cell.x * bounds.width;
      const y = bounds.y + cell.y * bounds.height;
      if (!full && ((x - point.x) ** 2 + (y - point.y) ** 2 > (radius + stepY) ** 2)) continue;
      const glyph = (cell.seed + phase * 13 + Math.round(cell.tone * 17)) % GLYPHS.length;
      const red = cell.seed % 47 === 0 ? 1 : 0;
      letters.globalAlpha = cell.alpha * (.12 + cell.tone * .88);
      letters.drawImage(this.atlas, glyph * 24, red * 24, 24, 24, x - glyphWidth / 2, y - glyphHeight / 2, glyphWidth, glyphHeight);
    }
    letters.globalAlpha = 1;
    // Both masks cover the full buffer: no code pixels can escape the photograph's alpha.
    letters.globalCompositeOperation = 'destination-in';
    letters.drawImage(this.source, bounds.x, bounds.y, bounds.width, bounds.height);
    letters.drawImage(this.mask, 0, 0, width, height);
    letters.globalCompositeOperation = 'source-over';
    context.drawImage(this.letters, 0, 0, width, height);
  }

  dispose() {
    [this.canvas, this.letters, this.mask, this.atlas].forEach(canvas => { canvas.width = canvas.height = 0; });
    this.cells.length = 0;
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
    let inView = true;
    let renderer: PortraitRenderer | null = null;
    let loading: Promise<PortraitRenderer | null> | null = null;
    let frame = 0;
    let lastTime = 0;
    let bounds = root.getBoundingClientRect();
    let boundsDirty = false;
    let fullWanted = false;
    let fullMode = false;
    let hoverWanted = false;
    let pointerOver = false;
    let pointerGeneration = 0;
    let showing = false;
    let strength = 0;
    const point = { x: bounds.width * .5, y: bounds.height * .42 };
    let target = { ...point };
    let clientPoint: Point | null = null;
    let geometrySettlesUntil = 0;

    const measure = () => {
      bounds = root.getBoundingClientRect();
      renderer?.resize(bounds.width, bounds.height);
      boundsDirty = false;
    };
    const markDirty = () => {
      boundsDirty = true;
      if (hoverWanted && pointerOver && !fullWanted && !reduced.matches) {
        // Scroll only invalidates geometry. Read the transformed bounds on the
        // next paint, and briefly follow the parent's scrub interpolation.
        geometrySettlesUntil = performance.now() + 900;
        wake();
      }
    };
    const show = (value: boolean) => {
      if (showing === value || disposed) return;
      showing = value;
      setEngaged(value);
    };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; };
    const animate = (time: number) => {
      frame = 0;
      if (disposed || !renderer || !inView || document.hidden) return;
      if (lastTime && time - lastTime < 1000 / MAX_FPS) { frame = requestAnimationFrame(animate); return; }
      const elapsed = lastTime ? Math.min(50, time - lastTime) : 25;
      lastTime = time;
      const trackingPoint = hoverWanted && pointerOver && !fullMode ? clientPoint : null;
      if (trackingPoint && (boundsDirty || time < geometrySettlesUntil)) {
        measure();
        target = { x: trackingPoint.x - bounds.left, y: trackingPoint.y - bounds.top };
        hoverWanted = renderer.hitTest(target);
      }
      const mix = reduced.matches ? 1 : 1 - Math.exp(-elapsed / 95);
      const goal = fullWanted || hoverWanted ? 1 : 0;
      strength += (goal - strength) * mix;
      point.x += (target.x - point.x) * mix;
      point.y += (target.y - point.y) * mix;
      if (Math.abs(goal - strength) < .003) strength = goal;
      renderer.draw(point, strength, fullMode, time);
      show(strength > 0);
      if (strength === 0 && !fullWanted) fullMode = false;
      const moving = Math.abs(target.x - point.x) + Math.abs(target.y - point.y) > .35;
      if (!reduced.matches && (Math.abs(goal - strength) > .003 || moving || (hoverWanted && time < geometrySettlesUntil))) frame = requestAnimationFrame(animate);
      else lastTime = 0;
    };
    const wake = () => { if (!frame && renderer && inView && !document.hidden) frame = requestAnimationFrame(animate); };
    const prepare = () => {
      if (renderer) return Promise.resolve(renderer);
      if (loading) return loading;
      // Sample the same responsive bitmap the visitor sees. No second image fetch.
      loading = source.decode().then(() => {
        if (disposed) return null;
        renderer = new PortraitRenderer(canvas, source, bounds.width);
        measure();
        return renderer;
      }).catch(() => {
        if (!disposed) setUnavailable(true);
        return null;
      });
      return loading;
    };
    const move = async (event: PointerEvent) => {
      if (event.pointerType === 'touch' || fullWanted || fullMode || reduced.matches || (event.target instanceof Element && event.target.closest('button'))) return;
      pointerOver = true;
      const generation = ++pointerGeneration;
      const client = { x: event.clientX, y: event.clientY };
      const ready = await prepare();
      if (!ready || disposed || generation !== pointerGeneration || !pointerOver || fullWanted || reduced.matches) return;
      clientPoint = client;
      boundsDirty = true;
      // The frame tests the exact silhouette after its single geometry read.
      hoverWanted = true;
      wake();
    };
    const enter = () => { pointerOver = true; measure(); if (fullWanted) wake(); };
    const leave = () => { pointerOver = false; clientPoint = null; geometrySettlesUntil = 0; pointerGeneration++; hoverWanted = false; wake(); };
    const toggle = async () => {
      const ready = await prepare();
      if (!ready || disposed) return;
      fullWanted = !fullWanted;
      if (fullWanted) fullMode = true;
      pointerGeneration++;
      hoverWanted = false;
      setFull(fullWanted);
      wake();
    };
    const resize = new ResizeObserver(() => {
      measure();
      boundsDirty = true;
      if (showing) wake();
    });
    resize.observe(root);
    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) { stop(); pointerGeneration++; hoverWanted = false; if (!fullWanted) { strength = 0; fullMode = false; } show(false); }
      else if (fullWanted) wake();
    }, { rootMargin: '80px' });
    visibility.observe(root);
    const pageVisibility = () => {
      if (document.hidden) { stop(); pointerGeneration++; show(false); hoverWanted = false; if (!fullWanted) { strength = 0; fullMode = false; } }
      else if (fullWanted) wake();
    };
    const preference = () => { hoverWanted = false; if (fullWanted || showing) wake(); };
    root.addEventListener('pointerenter', enter);
    root.addEventListener('pointermove', move, { passive: true });
    root.addEventListener('pointerleave', leave);
    button.addEventListener('click', toggle);
    window.addEventListener('scroll', markDirty, { passive: true });
    document.addEventListener('visibilitychange', pageVisibility);
    reduced.addEventListener('change', preference);
    return () => {
      disposed = true;
      stop();
      resize.disconnect(); visibility.disconnect();
      root.removeEventListener('pointerenter', enter);
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerleave', leave);
      button.removeEventListener('click', toggle);
      window.removeEventListener('scroll', markDirty);
      document.removeEventListener('visibilitychange', pageVisibility);
      reduced.removeEventListener('change', preference);
      renderer?.dispose();
    };
  }, []);

  return <div ref={rootRef} className={styles.portrait} data-portrait-state={engaged ? 'code' : 'photo'} data-portrait-full={full ? 'true' : 'false'}>
    <Image ref={imageRef} className={styles.image} src="/images/hero-transparent.png" alt="Piyush Rajput wearing sunglasses and a black shirt, in an original black-and-white halftone portrait" width={1145} height={1374} sizes="(max-width:460px) 88vw, (max-width:700px) 408px, 52vw" priority fetchPriority="high"/>
    <canvas ref={canvasRef} className={styles.canvas} data-portrait-canvas aria-hidden="true"/>
    <button ref={buttonRef} className={styles.toggle} type="button" aria-label="Explore portrait as code" aria-pressed={full} disabled={unavailable}><span aria-hidden="true">&lt;/&gt;</span>{full ? 'RETURN TO PORTRAIT' : 'EXPLORE AS CODE'}<span aria-hidden="true">{full ? '−' : '+'}</span></button>
    <span className="sr-only" role="status">{unavailable ? 'The original portrait is displayed.' : full ? 'Portrait shown as a static code illustration. Press again to return to the photograph.' : 'Move over the portrait to reveal code, or use the Explore portrait as code button.'}</span>
  </div>;
}
