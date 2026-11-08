'use client';

import { useEffect } from 'react';
import styles from './PortfolioBoot.module.scss';

export default function PortfolioBoot() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.portfolioBoot !== 'loading') return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pending = true;
    const finish = () => {
      if (!pending) return;
      pending = false;
      window.clearTimeout(watchdog);
      root.dataset.portfolioBoot = 'ready';
    };
    const watchdog = window.setTimeout(finish, 1250);
    const portrait = document.querySelector<HTMLImageElement>('[data-hero-portrait] img');
    void Promise.allSettled([portrait?.decode(), document.fonts?.ready]).then(finish);
    motion.addEventListener('change', finish);

    return () => {
      pending = false;
      window.clearTimeout(watchdog);
      motion.removeEventListener('change', finish);
      delete root.dataset.portfolioBoot;
    };
  }, []);

  return (
    <span className={styles.signal} data-portfolio-boot-status>
      <span className={styles.lamp} aria-hidden="true" />
      <span className={styles.readout}>
        <span className={styles.ready}>SYSTEM ONLINE</span>
        <span className={styles.startup} aria-hidden="true">INITIALIZING WORLD</span>
      </span>
      <span className={styles.sweep} aria-hidden="true"><span /></span>
    </span>
  );
}
