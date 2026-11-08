"use client";

import { lazy, Suspense, useEffect, useRef, useState, type PointerEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMotionActive } from '@/lib/motion-activation';
import { ANCHOR_TRAVEL_EVENT, NAV_VISIBILITY_EVENT, type NavVisibility } from '@/lib/scroll-events';
import NavigationRefraction from './NavigationRefraction';
import ThemeToggle from './ThemeToggle';
import styles from './Navigation.module.scss';

const links = [
  ['The Mind', 'mind'], ['Education', 'education'], ['Skills', 'skills'],
  ['Selected Work', 'work'], ['Let’s Talk', 'contact'],
] as const;
const NavigationMenu = lazy(() => import('./NavigationMenu'));
const NavigationMotion = dynamic(() => import('./motion/NavigationMotion'), { ssr: false });
const isChapter = (id: string) => links.some(([, section]) => section === id);

/** CSS owns the glass. GSAP slides the bar and Motion handles the mobile disclosure. */
export default function Navigation() {
  const [open, setOpen] = useState(false);
  const [menuLoaded, setMenuLoaded] = useState(false);
  const [active, setActive] = useState('');
  const path = usePathname();
  const motion = useMotionActive();
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  const contact = useRef<HTMLAnchorElement>(null);
  const frame = useRef<number | null>(null);
  const enabled = useRef(false);
  const bounds = useRef<DOMRect | null>(null);
  const contactBounds = useRef<DOMRect | null>(null);
  const point = useRef({ x: 50, y: 0, magnetX: 0, magnetY: 0 });

  useEffect(() => {
    const element = header.current;
    if (!element) return;
    let pivot = Math.max(0, window.scrollY);
    let hidden = element.dataset.navHidden === 'true';
    let keyboardFocus = false;
    let anchorTravel = false;

    const setHidden = (next: boolean, immediate = false) => {
      if (hidden === next && !immediate) return;
      hidden = next;
      element.dataset.navHidden = String(next);
      element.dispatchEvent(new CustomEvent<NavVisibility>(NAV_VISIBILITY_EVENT, { detail: { hidden, immediate } }));
    };
    const show = (immediate = false) => {
      pivot = Math.max(0, window.scrollY);
      setHidden(false, immediate);
    };
    const onScroll = () => {
      const y = Math.max(0, window.scrollY);
      if (y <= 24 || keyboardFocus || anchorTravel || element.dataset.menuOpen === 'true') {
        pivot = y;
        setHidden(false);
        return;
      }
      // Track the local extremum to ignore a tiny scroll reversal or trackpad jitter.
      if (hidden) {
        pivot = Math.max(pivot, y);
        if (pivot - y < 18) return;
      } else {
        pivot = Math.min(pivot, y);
        if (y < 108 || y - pivot < 30) return;
      }
      pivot = y;
      setHidden(!hidden);
    };
    const focusIn = (event: FocusEvent) => {
      keyboardFocus = event.target instanceof HTMLElement && event.target.matches(':focus-visible');
      if (keyboardFocus) show(true);
    };
    const focusOut = () => { keyboardFocus = false; pivot = Math.max(0, window.scrollY); };
    const hashChanged = () => show();
    const travel = (event: Event) => {
      anchorTravel = (event as CustomEvent<boolean>).detail;
      show();
    };

    show(true);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('hashchange', hashChanged);
    window.addEventListener(ANCHOR_TRAVEL_EVENT, travel);
    element.addEventListener('focusin', focusIn);
    element.addEventListener('focusout', focusOut);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('hashchange', hashChanged);
      window.removeEventListener(ANCHOR_TRAVEL_EVENT, travel);
      element.removeEventListener('focusin', focusIn);
      element.removeEventListener('focusout', focusOut);
    };
  }, [path]);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1100px)');
    const closeAtDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener('change', closeAtDesktop);
    return () => desktop.removeEventListener('change', closeAtDesktop);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    const outside = (event: globalThis.PointerEvent) => { if (!nav.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside); };
  }, [open]);

  useEffect(() => {
    if (path !== '/') return;
    const readHash = () => { const id = window.location.hash.slice(1); setActive(isChapter(id) ? id : ''); };
    readHash();
    window.addEventListener('hashchange', readHash);
    const observer = new IntersectionObserver(entries => {
      const entered = entries.filter(entry => entry.isIntersecting);
      if (entered.length) {
        const nearest = entered.reduce((best, entry) => Math.abs(entry.boundingClientRect.top) < Math.abs(best.boundingClientRect.top) ? entry : best);
        setActive(nearest.target.id);
      }
    }, { rootMargin: '-18% 0px -60% 0px', threshold: 0 });
    links.forEach(([, id]) => { const section = document.getElementById(id); if (section) observer.observe(section); });
    return () => { observer.disconnect(); window.removeEventListener('hashchange', readHash); };
  }, [path]);

  useEffect(() => {
    const element = nav.current;
    if (!element) return;
    const measure = () => { bounds.current = element.getBoundingClientRect(); };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => { observer.disconnect(); if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, []);

  function scheduleReflection() {
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      nav.current?.style.setProperty('--shine-x', `${point.current.x}%`);
      nav.current?.style.setProperty('--shine-y', `${point.current.y}%`);
      nav.current?.style.setProperty('--reflection', '1');
      contact.current?.style.setProperty('--magnet-x', `${point.current.magnetX}px`);
      contact.current?.style.setProperty('--magnet-y', `${point.current.magnetY}px`);
    });
  }
  function enterGlass(event: PointerEvent<HTMLElement>) {
    enabled.current = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches;
    bounds.current = event.currentTarget.getBoundingClientRect();
  }
  function moveGlass(event: PointerEvent<HTMLElement>) {
    const rectangle = bounds.current;
    if (!enabled.current || !rectangle) return;
    point.current.x = Math.min(100, Math.max(0, (event.clientX - rectangle.left) / rectangle.width * 100));
    point.current.y = Math.min(100, Math.max(0, (event.clientY - rectangle.top) / rectangle.height * 100));
    scheduleReflection();
  }
  function leaveGlass() {
    if (frame.current !== null) { cancelAnimationFrame(frame.current); frame.current = null; }
    enabled.current = false;
    point.current.magnetX = 0; point.current.magnetY = 0;
    nav.current?.style.setProperty('--reflection', '0');
    contact.current?.style.setProperty('--magnet-x', '0px');
    contact.current?.style.setProperty('--magnet-y', '0px');
  }

  const menuLinks = links.map(([label, id], index) => <a key={id} href={`/#${id}`} aria-current={path === '/' && active === id ? 'location' : undefined} onClick={() => { setActive(id); setOpen(false); }} className={id === 'contact' ? styles.mobileContact : undefined}><span>0{index + 1}</span>{label}<span aria-hidden="true">↗</span></a>);
  return <header ref={header} className={styles.header} data-menu-open={open ? 'true' : undefined}>
    <nav ref={nav} aria-label="Main navigation" className={styles.nav} onPointerEnter={enterGlass} onPointerMove={moveGlass} onPointerLeave={leaveGlass} onPointerCancel={leaveGlass}>
      <span className={styles.glassSurface} data-glass-surface aria-hidden="true" />
      <Link href="/" className={styles.identity} aria-label="Piyush Rajput — home">PIYUSH RAJPUT</Link>
      <div className={styles.navActions}>
        <div className={styles.desktop}>{links.map(([label, id]) => <a ref={id === 'contact' ? contact : undefined} key={id} href={`/#${id}`} className={id === 'contact' ? styles.contact : styles.navLink} aria-current={path === '/' && active === id ? 'location' : undefined} onClick={() => setActive(id)} onPointerEnter={id === 'contact' ? event => { contactBounds.current = event.currentTarget.getBoundingClientRect(); } : undefined} onPointerMove={id === 'contact' ? event => {
          const rectangle = contactBounds.current;
          if (!enabled.current || !rectangle) return;
          point.current.magnetX = ((event.clientX - rectangle.left) / rectangle.width - .5) * 5;
          point.current.magnetY = ((event.clientY - rectangle.top) / rectangle.height - .5) * 4;
          scheduleReflection();
        } : undefined} onPointerLeave={id === 'contact' ? () => { point.current.magnetX = 0; point.current.magnetY = 0; if (enabled.current) scheduleReflection(); } : undefined}><span className={id === 'contact' ? styles.contactInner : undefined}>{label}{id === 'contact' && <span aria-hidden="true">↗</span>}</span></a>)}</div>
        <ThemeToggle />
        <button ref={toggle} className={styles.toggle} type="button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => { setMenuLoaded(true); setOpen(!open); }}><span>{open ? 'Close' : 'Menu'}</span><span className={styles.menuMark} aria-hidden="true">{open ? '−' : '+'}</span></button>
      </div>
      {menuLoaded && <Suspense fallback={open ? <div id="mobile-navigation" className={styles.mobile}>{menuLinks}</div> : null}><NavigationMenu open={open}>{menuLinks}</NavigationMenu></Suspense>}
    </nav>
    <NavigationRefraction nav={nav} />
    {motion && <NavigationMotion header={header} />}
  </header>;
}
