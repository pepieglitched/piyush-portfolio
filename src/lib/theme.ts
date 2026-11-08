export const THEME_KEY = 'portfolio-theme';
export const THEME_EVENT = 'portfolio:theme';
export type PortfolioTheme = 'editorial' | 'cyber';

export function readTheme(): PortfolioTheme {
  return document.documentElement.dataset.theme === 'cyber' ? 'cyber' : 'editorial';
}

export function syncThemeColor(theme: PortfolioTheme) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'cyber' ? '#080d17' : '#f3f0e8';
}

export function setTheme(theme: PortfolioTheme) {
  document.documentElement.dataset.theme = theme;
  syncThemeColor(theme);
  try { window.localStorage.setItem(THEME_KEY, theme); }
  catch { /* The chosen theme still applies when storage is unavailable. */ }
  window.dispatchEvent(new CustomEvent<PortfolioTheme>(THEME_EVENT, { detail: theme }));
}

export function subscribeTheme(listener: () => void) {
  window.addEventListener(THEME_EVENT, listener);
  return () => window.removeEventListener(THEME_EVENT, listener);
}
