'use client';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import SignalGlyph from './SignalGlyph';
import styles from './Navigation.module.scss';
const links = [['The mind', '/#mind'], ['Selected work', '/#work'], ['Play', '/#signal-run'], ['Let’s talk', '/#contact']] as const;
const NavigationMenu = lazy(() => import('./NavigationMenu'));

export default function Navigation() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    const outside = (e: PointerEvent) => { if (!nav.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', outside);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', outside); };
  }, [open]);
  const menuLinks = links.map(([label, href], i) => <a key={href} href={href} onClick={() => setOpen(false)}><span>0{i + 1}</span>{label}<span aria-hidden="true">↗</span></a>);
  return <header className={styles.header}><nav ref={nav} aria-label="Main navigation" className={styles.nav}>
    <Link href="/" className={styles.identity} aria-label="Piyush Rajput — home"><SignalGlyph /><span>PIYUSH RAJPUT<small>STUDENT. THINKER. BUILDER.</small></span></Link>
    <div className={styles.desktop}>{links.map(([label, href], i) => <a key={href} href={href} className={i === 3 ? styles.contact : ''}>{label}{i === 3 && <span aria-hidden="true">↗</span>}</a>)}</div>
    <button ref={toggle} className={styles.toggle} type="button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? 'Close −' : 'Menu +'}</button>
    {open && <Suspense fallback={<div id="mobile-navigation" className={styles.mobile}>{menuLinks}</div>}><NavigationMenu>{menuLinks}</NavigationMenu></Suspense>}
  </nav></header>;
}
