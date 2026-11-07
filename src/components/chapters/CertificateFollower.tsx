'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import type { Certificate, PreviewMover, PreviewPoint } from './EvidencePreviews';
import styles from './EvidenceChapter.module.scss';

gsap.registerPlugin(useGSAP);

const EDGE = 12;
const GAP = 18;
const MAX_WIDTH = 350;

type Props = {
  id: string;
  certificate: Certificate;
  position: RefObject<PreviewPoint>;
  moveRef: RefObject<PreviewMover | null>;
  visible: boolean;
};

export default function CertificateFollower({ id, certificate, position, moveRef, visible }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const entrance = useRef<gsap.core.Timeline | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { width, height, preview } = certificate;

  useGSAP(() => {
    if (!frame.current) return;
    const card = frame.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const glideX = gsap.quickTo(card, 'x', { duration: 0.27, ease: 'power3.out' });
    const glideY = gsap.quickTo(card, 'y', { duration: 0.27, ease: 'power3.out' });
    const timeline = gsap.timeline({ paused: true }).fromTo(card, {
      autoAlpha: 0,
      scale: 0.94,
    }, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.22,
      ease: 'power2.out',
    });
    entrance.current = timeline;

    const aspect = width / height;
    let viewportWidth = 0;
    let viewportHeight = 0;
    let cardWidth = 0;
    let cardHeight = 0;
    const clamp = (value: number, max: number) => Math.max(EDGE, Math.min(value, max - EDGE));

    function place(point: PreviewPoint, snap = false) {
      if (reduced.matches && !snap) return;
      const right = point.x + GAP;
      const bottom = point.y + GAP;
      const x = clamp(right + cardWidth <= viewportWidth - EDGE ? right : point.x - GAP - cardWidth, viewportWidth - cardWidth);
      const y = clamp(bottom + cardHeight <= viewportHeight - EDGE ? bottom : point.y - GAP - cardHeight, viewportHeight - cardHeight);
      if (snap) {
        glideX(x, x);
        glideY(y, y);
        glideX.tween.progress(1);
        glideY.tween.progress(1);
      } else {
        glideX(x);
        glideY(y);
      }
    }

    function resize() {
      viewportWidth = document.documentElement.clientWidth;
      viewportHeight = window.innerHeight;
      cardWidth = Math.min(MAX_WIDTH, viewportWidth - EDGE * 2, (viewportHeight - EDGE * 2) * aspect);
      cardHeight = cardWidth / aspect;
      card.style.width = `${cardWidth}px`;
      place(position.current, true);
    }

    resize();
    moveRef.current = place;
    window.addEventListener('resize', resize);
    return () => {
      if (moveRef.current === place) moveRef.current = null;
      entrance.current = null;
      window.removeEventListener('resize', resize);
    };
  }, { scope: frame, dependencies: [height, moveRef, position, width], revertOnUpdate: true });

  useEffect(() => {
    const timeline = entrance.current;
    if (!timeline) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const settle = () => {
      const show = visible && loaded;
      if (reduced.matches) {
        moveRef.current?.(position.current, true);
        timeline.progress(show ? 1 : 0).pause();
      } else if (show) {
        timeline.play();
      } else {
        timeline.reverse();
      }
    };
    settle();
    reduced.addEventListener('change', settle);
    return () => reduced.removeEventListener('change', settle);
  }, [loaded, moveRef, position, visible]);

  return (
    <div ref={frame} className={styles.follower} data-certificate-preview={id} aria-hidden="true">
      <Image src={preview} alt="" width={width} height={height} loading="eager" unoptimized onLoad={() => setLoaded(true)} />
    </div>
  );
}
