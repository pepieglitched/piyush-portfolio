'use client';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
const SignalRun = dynamic(() => import('./game/SignalRun'), { ssr: false, loading: () => <div style={{ padding: '5rem 1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>INITIALIZING SIGNAL RUN…</div> });
export default function GameChapter() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setReady(true); observer.disconnect(); } }, { rootMargin: '350px' });
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={root} style={{ minHeight: '480px' }}>{ready ? <SignalRun /> : <div style={{ padding: '5rem 1rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>SIGNAL RUN / A PLAYABLE INTERMISSION<noscript><p>Enable JavaScript to play this optional game. All portfolio content is available below.</p></noscript></div>}</div>;
}
