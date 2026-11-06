'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, useGSAP);
export const motionConfig = { ease: 'power3.out', duration: .85 } as const;

/** GSAP owns only data-reveal/hero/portrait transforms; other systems have their own elements. */
export default function Experience() {
  const path = usePathname();
  useEffect(() => {
    // Touch browsers retain native momentum and anchor scrolling.
    const media = window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)');
    let dispose = () => {};
    const setup = () => {
      dispose();
      dispose = () => {};
      if (media.matches) return;
      const lenis = new Lenis({ autoRaf: false, smoothWheel: true, syncTouch: false, anchors: false, duration: 1.05,
        stopInertiaOnNavigate: true,
        prevent: (node) => node.hasAttribute('data-lenis-prevent'), });
      const tick = (seconds: number) => lenis.raf(seconds * 1000);
      lenis.on('scroll', ScrollTrigger.update);
      // Lenis follows GSAP's one clock. Real elapsed time avoids delayed scrolling after a long frame.
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.add(tick);

      // Stop wheel inertia before the browser handles anchors, history, or keyboard navigation.
      // The default event is preserved, including native focus, hash, and history behavior.
      const releaseToNative = () => { lenis.stop(); lenis.start(); };
      const anchor = (event: MouseEvent) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
        if (!link || link.download || (link.target && link.target !== '_self')) return;
        const url = new URL(link.href, window.location.href);
        if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash) releaseToNative();
      };
      const keyboard = (event: KeyboardEvent) => {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
        if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
        const target = event.target;
        if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, button'))) return;
        releaseToNative();
      };
      document.addEventListener('click', anchor, true);
      document.addEventListener('keydown', keyboard);
      window.addEventListener('popstate', releaseToNative);
      window.addEventListener('hashchange', releaseToNative);
      dispose = () => {
        document.removeEventListener('click', anchor, true);
        document.removeEventListener('keydown', keyboard);
        window.removeEventListener('popstate', releaseToNative);
        window.removeEventListener('hashchange', releaseToNative);
        gsap.ticker.remove(tick);
        lenis.off('scroll', ScrollTrigger.update);
        lenis.destroy();
        // Restore the GSAP defaults when this page's scrolling controller is removed.
        gsap.ticker.lagSmoothing(500, 33);
      };
    };
    setup();
    media.addEventListener('change', setup);
    return () => { media.removeEventListener('change', setup); dispose(); };
  }, [path]);

  useGSAP((_context, contextSafe) => {
    if (!contextSafe) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const intro = gsap.timeline({ defaults: motionConfig });
      const heroLines = gsap.utils.toArray<HTMLElement>('[data-hero-line]');
      const heroNotes = gsap.utils.toArray<HTMLElement>('[data-hero-note]');
      intro.addLabel('identity');
      if (heroLines.length) intro.from(heroLines, { y: 32, duration: 1, stagger: .1, clearProps: 'transform' }, 'identity');
      if (heroNotes.length) intro.from(heroNotes, { y: 14, duration: .7, clearProps: 'transform' }, 'identity+=.25');
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((element) => {
        gsap.from(element, { y: 30, ...motionConfig, scrollTrigger: { trigger: element, start: 'top 92%', once: true }, clearProps: 'transform' });
      });
      gsap.utils.toArray<HTMLElement>('[data-draw]').forEach((element) => {
        gsap.fromTo(element, { scaleX: .05 }, { scaleX: 1, transformOrigin: 'left center', ease: 'none', scrollTrigger: { trigger: element, start: 'top 95%', end: 'top 30%', scrub: .6 } });
      });
    });
    media.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const portrait = document.querySelector<HTMLElement>('[data-hero-portrait]');
      const human = document.getElementById('human');
      if (portrait && human) gsap.to(portrait, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: human, start: 'top top', end: 'bottom top', scrub: .7 } });
      gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((element) => gsap.fromTo(element, { y: -24 }, { y: 24, ease: 'none', scrollTrigger: { trigger: element.parentElement, start: 'top bottom', end: 'bottom top', scrub: .7 } }));
    });
    const arrows = document.querySelectorAll<HTMLElement>('[data-magnetic]');
    const enter = contextSafe((event: PointerEvent) => {
      if (!window.matchMedia('(pointer:fine) and (prefers-reduced-motion:no-preference)').matches) return;
      gsap.to(event.currentTarget, {x:5, y:-5, duration:.25, overwrite:'auto'});
    });
    const leave = contextSafe((event: PointerEvent) => gsap.to(event.currentTarget, {x:0, y:0, duration:.3, overwrite:'auto'}));
    arrows.forEach(element => {element.addEventListener('pointerenter', enter);element.addEventListener('pointerleave', leave);});
    let active = true;
    void document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
    return () => { active = false; media.revert(); arrows.forEach(element => {element.removeEventListener('pointerenter', enter);element.removeEventListener('pointerleave', leave);}); };
  }, { dependencies: [path], revertOnUpdate: true });
  return null;
}

