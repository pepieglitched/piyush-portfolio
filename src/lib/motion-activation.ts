'use client';

import { useSyncExternalStore } from 'react';

let active = false;
let engaged = false;
let teardown: (() => void) | undefined;
const subscribers = new Set<() => void>();
const events = ['pointermove', 'wheel', 'touchstart', 'keydown'] as const;
const publish = () => subscribers.forEach(callback => callback());

function subscribe(callback: () => void) {
  subscribers.add(callback);
  if (!teardown && typeof window !== 'undefined') {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const disarm = () => events.forEach(name => window.removeEventListener(name, engage));
    const engage = () => {
      engaged = true;
      document.documentElement.dataset.interacting = 'true';
      active = !preference.matches;
      disarm();
      publish();
    };
    const update = () => {
      active = engaged && !preference.matches;
      publish();
    };
    if (!engaged) events.forEach(name => window.addEventListener(name, engage, {passive: true}));
    preference.addEventListener('change', update);
    teardown = () => {disarm(); preference.removeEventListener('change', update); teardown = undefined;};
  }
  return () => {subscribers.delete(callback); if (!subscribers.size) teardown?.();};
}

/** One input/preference subscription is shared by every lazy motion chapter. */
export function useMotionActive() {
  return useSyncExternalStore(subscribe, () => active, () => false);
}
