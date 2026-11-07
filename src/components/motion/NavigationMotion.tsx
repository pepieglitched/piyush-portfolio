'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { NAV_VISIBILITY_EVENT, type NavVisibility } from '@/lib/scroll-events';

gsap.registerPlugin(useGSAP);

export default function NavigationMotion({ header }: { header: RefObject<HTMLElement | null> }) {
  useGSAP(() => {
    const element = header.current;
    if (!element) return;
    element.setAttribute('data-nav-motion', 'true');
    const slide = gsap.fromTo(
      element,
      { yPercent: 0, y: 0 },
      { yPercent: -100, y: -28, duration: .32, ease: 'power2.inOut', paused: true },
    );
    slide.progress(element.dataset.navHidden === 'true' ? 1 : 0).pause();

    const move = (event: Event) => {
      const { hidden, immediate } = (event as CustomEvent<NavVisibility>).detail;
      if (immediate) slide.progress(hidden ? 1 : 0).pause();
      else if (hidden) slide.play();
      else slide.reverse();
    };
    element.addEventListener(NAV_VISIBILITY_EVENT, move);
    return () => {
      element.removeEventListener(NAV_VISIBILITY_EVENT, move);
      element.removeAttribute('data-nav-motion');
    };
  }, { scope: header });
  return null;
}
