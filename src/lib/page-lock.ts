/** Keep a native dialog from shifting the page or discarding its scroll position. */
export function lockPage(): (restorePosition: boolean) => void {
  const root = document.documentElement;
  const { overflow, scrollbarGutter } = root.style;
  const x = window.scrollX;
  const y = window.scrollY;
  if (window.innerWidth > root.clientWidth) root.style.scrollbarGutter = 'stable';
  root.style.overflow = 'hidden';
  return restorePosition => {
    root.style.overflow = overflow;
    root.style.scrollbarGutter = scrollbarGutter;
    if (restorePosition && (window.scrollX !== x || window.scrollY !== y)) {
      window.scrollTo({ left: x, top: y, behavior: 'instant' });
    }
  };
}
