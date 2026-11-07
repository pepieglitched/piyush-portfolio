'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import LocomotiveScroll from 'locomotive-scroll';
import { ANCHOR_TRAVEL_EVENT } from '@/lib/scroll-events';

gsap.registerPlugin(ScrollTrigger, useGSAP);
export const motionConfig = { ease: 'power3.out', duration: .85 } as const;

/** GSAP owns only data-reveal/hero/portrait transforms; other systems have their own elements. */
export default function Experience() {
  const path = usePathname();
  const releaseScroll = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    // Locomotive v5 drives native window scroll, so ScrollTrigger needs no proxy.
    const media = window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)');
    const root = document.documentElement;
    let dispose: (() => void) | undefined;

    const setup = () => {
      dispose?.();
      dispose = undefined;
      if (media.matches) return;
      let scroll: LocomotiveScroll | undefined;
      let disconnect: (() => void) | undefined;
      let frame = requestAnimationFrame(() => {
        const instance = new LocomotiveScroll({
          autoStart: false,
          lenisOptions: { autoRaf: false, smoothWheel: true, syncTouch: false, anchors: false },
          initCustomTicker: render => gsap.ticker.add(render),
          destroyCustomTicker: render => gsap.ticker.remove(render),
          scrollCallback: () => ScrollTrigger.update(),
        });
        scroll = instance;

        // v5 creates its observer core on the next frame. Start after it has bound its listeners.
        frame = requestAnimationFrame(() => {
          frame = 0;
          instance.start();
          root.dataset.scrollEngine = 'locomotive';
          disconnect = connectAnchors(instance);
          ScrollTrigger.refresh();
        });
      });

      dispose = () => {
        cancelAnimationFrame(frame);
        disconnect?.();
        delete root.dataset.scrollEngine;
        delete root.dataset.scrollOrientation;
        if (!scroll) return;
        const instance = scroll;
        if (frame) {
          // Let the constructor's queued init finish before destroying a not-yet-started instance.
          requestAnimationFrame(() => instance.destroy());
        } else {
          instance.destroy();
        }
      };
    };

    function connectAnchors(scroll: LocomotiveScroll) {
      let anchorTimer: number | undefined;
      const setTravel = (active: boolean) => window.dispatchEvent(new CustomEvent(ANCHOR_TRAVEL_EVENT, { detail: active }));
      const finishAnchor = () => {
        if (anchorTimer === undefined) return;
        window.clearTimeout(anchorTimer);
        anchorTimer = undefined;
        setTravel(false);
      };
      const releaseToNative = () => {
        finishAnchor();
        scroll.stop();
        scroll.start();
      };
      const anchor = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
        if (!link || link.download || (link.target && link.target !== '_self')) return;
        const url = new URL(link.href, window.location.href);
        if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
        let target: HTMLElement | null;
        try {
          target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
        } catch {
          return;
        }
        if (!target) return;

        event.preventDefault();
        if (url.hash !== location.hash) {
          const oldURL = location.href;
          history.pushState(history.state, '', url);
          window.dispatchEvent(new HashChangeEvent('hashchange', { oldURL, newURL: location.href }));
        } else {
          releaseToNative();
        }
        const destination = target;
        const keyboardActivation = event.detail === 0;
        // Locomotive 5.0.1's bundled engine expects the document padding as an explicit offset.
        const padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
        const margin = parseFloat(getComputedStyle(destination).scrollMarginTop) || 0;
        anchorTimer = window.setTimeout(finishAnchor, 1200);
        setTravel(true);
        scroll.scrollTo(destination, {
          offset: -padding - margin,
          duration: .85,
          onComplete: () => {
            finishAnchor();
            if (keyboardActivation && destination.isConnected) {
              destination.setAttribute('tabindex', '-1');
              destination.focus({ preventScroll: true });
            }
          },
        });
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
      window.addEventListener('wheel', finishAnchor, { passive: true });
      window.addEventListener('popstate', releaseToNative);
      window.addEventListener('hashchange', releaseToNative);
      releaseScroll.current = releaseToNative;
      return () => {
        finishAnchor();
        document.removeEventListener('click', anchor, true);
        document.removeEventListener('keydown', keyboard);
        window.removeEventListener('wheel', finishAnchor);
        window.removeEventListener('popstate', releaseToNative);
        window.removeEventListener('hashchange', releaseToNative);
        releaseScroll.current = undefined;
      };
    }

    setup();
    media.addEventListener('change', setup);
    return () => { media.removeEventListener('change', setup); dispose?.(); };
  }, []);

  useEffect(() => { releaseScroll.current?.(); }, [path]);

  useGSAP((_context, contextSafe) => {
    if (!contextSafe) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      // Home chapters have their own scoped drivers; retain route entrances for the case studies.
      if (path === '/') return;
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
      if (path === '/') return;
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

