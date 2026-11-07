'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useMotionActive } from '@/lib/motion-activation';
import type { ChapterKind } from '@/lib/animation-config';

const ChapterDriver = dynamic(() => import('./ChapterDriver'), {ssr: false});

/** The HTML is server rendered; each driver receives its own component-scoped ref. */
export default function MotionChapter({kind, children}: {kind: ChapterKind; children: ReactNode}) {
  const scope = useRef<HTMLDivElement>(null);
  const [scopeElement, setScopeElement] = useState<HTMLDivElement | null>(null);
  const attachScope = useCallback((element: HTMLDivElement | null) => {
    scope.current = element;
    setScopeElement(element);
  }, []);
  const active = useMotionActive();
  return <div ref={attachScope} className="motion-chapter" data-motion-chapter={kind}>
    {children}
    {active && scopeElement && <ChapterDriver kind={kind} scope={scope}/>}
  </div>;
}
