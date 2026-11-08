'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { readTheme, setTheme, subscribeTheme, syncThemeColor, type PortfolioTheme } from '@/lib/theme';
import styles from './ThemeToggle.module.scss';

const defaultTheme = (): PortfolioTheme => 'editorial';

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, defaultTheme);
  const cyber = theme === 'cyber';

  useEffect(() => { syncThemeColor(theme); }, [theme]);

  return (
    <button
      type="button"
      role="switch"
      aria-label="Cyber theme"
      aria-checked={cyber}
      className={styles.switch}
      onClick={() => setTheme(cyber ? 'editorial' : 'cyber')}
    >
      <span className={styles.editorial} aria-hidden="true">Editorial</span>
      <span className={styles.cyber} aria-hidden="true">Cyber</span>
    </button>
  );
}
