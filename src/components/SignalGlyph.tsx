'use client';
import { useEffect, useRef } from 'react';
/** Anime.js owns just this local SVG rotation, with no perpetual loop. */
export default function SignalGlyph({ className = '' }: { className?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let disposed = false;
    let animation: { revert: () => void } | undefined;
    const pulse = async () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const { animate } = await import('animejs');
      if (disposed) return;
      animation?.revert();
      animation = animate(element, { rotate: [0, 90], duration: 650, ease: 'outExpo' });
    };
    const parent = element.closest('a,button') || element;
    parent.addEventListener('pointerenter', pulse);
    parent.addEventListener('focus', pulse);
    return () => { disposed = true; animation?.revert(); parent.removeEventListener('pointerenter', pulse); parent.removeEventListener('focus', pulse); };
  }, []);
  return <svg ref={ref} className={className} aria-hidden="true" viewBox="0 0 64 64"><path d="M29 4h6v21L50 10l4 4-15 15h21v6H39l15 15-4 4-15-15v21h-6V39L14 54l-4-4 15-15H4v-6h21L10 14l4-4 15 15z" fill="currentColor" /></svg>;
}
