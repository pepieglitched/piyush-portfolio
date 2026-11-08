'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import styles from './GameChapter.module.scss';

function GamePlaceholder() {
  return (
    <div className={styles.placeholder}>
      SIGNAL RUN / READYING THE ARCADE
      <noscript><p>Enable JavaScript to play Signal Run.</p></noscript>
    </div>
  );
}

const SignalRun = dynamic(() => import('./game/SignalRun'), { ssr: false, loading: GamePlaceholder });

export default function GameChapter() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setReady(true); observer.disconnect(); } }, { rootMargin: '350px' });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={root} className={styles.shell} data-game-shell>{ready ? <SignalRun /> : <GamePlaceholder />}</div>;
}
