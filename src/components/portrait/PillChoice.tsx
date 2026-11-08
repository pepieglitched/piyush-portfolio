'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type RefObject } from 'react';
import { lockPage } from '@/lib/page-lock';
import styles from './PillChoice.module.scss';

gsap.registerPlugin(useGSAP);

export default function PillChoice({ trigger, onDismiss }: {
  trigger: RefObject<HTMLButtonElement | null>;
  onDismiss: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const portrait = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const last = useRef<HTMLButtonElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const unlock = useRef<ReturnType<typeof lockPage> | null>(null);
  const timeout = useRef<number | undefined>(undefined);
  const leaving = useRef(false);
  const closing = useRef(false);
  const [declined, setDeclined] = useState(false);

  const { contextSafe } = useGSAP(() => {
    const frame = dialog.current;
    const opener = trigger.current;
    const openDialog = document.querySelector('dialog[open]');
    if (!frame || !opener || (openDialog && openDialog !== frame)) {
      onDismiss();
      return;
    }

    const origin = opener.querySelector('img')?.getBoundingClientRect();
    unlock.current = lockPage();
    if (!frame.open) frame.showModal();
    close.current?.focus({ preventScroll: true });
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const sequence = gsap.timeline({ defaults: { ease: 'power3.out' } });
      const picture = portrait.current;
      sequence.from(veil.current, { opacity: 0, duration: .38 }, 0);
      sequence.from(surface.current, { opacity: 0, scale: .97, duration: .42 }, 0);
      if (picture && origin?.width && origin.height) {
        const destination = picture.getBoundingClientRect();
        sequence.from(picture, {
          x: origin.left + (origin.width - destination.width) / 2 - destination.left,
          y: origin.top + (origin.height - destination.height) / 2 - destination.top,
          scale: Math.min(origin.width / destination.width, origin.height / destination.height),
          rotation: 7,
          duration: .56,
          clearProps: 'transform',
        }, 0);
      }
      sequence.from(copy.current, { opacity: 0, y: 14, duration: .35, clearProps: 'transform,opacity' }, .21);
    });

    return () => {
      media.revert();
      window.clearTimeout(timeout.current);
      unlock.current?.(false);
      unlock.current = null;
    };
  }, { scope: dialog });

  function requestClose() {
    const frame = dialog.current;
    if (!frame?.open || closing.current) return;
    closing.current = true;
    window.clearTimeout(timeout.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      frame.close();
      return;
    }
    contextSafe(() => {
      gsap.to(veil.current, { opacity: 0, duration: .2, overwrite: 'auto' });
      gsap.to(panel.current, { opacity: 0, y: 8, scale: .98, duration: .2, onComplete: () => frame.close() });
    })();
  }

  useEffect(() => {
    if (declined) feedback.current?.focus({ preventScroll: true });
  }, [declined]);

  function decline() {
    setDeclined(true);
    timeout.current = window.setTimeout(requestClose, 2700);
  }

  function afterClose() {
    window.clearTimeout(timeout.current);
    unlock.current?.(!leaving.current);
    unlock.current = null;
    if (!leaving.current) trigger.current?.focus({ preventScroll: true });
    onDismiss();
  }

  function enterGame(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    leaving.current = true;
    unlock.current?.(false);
    unlock.current = null;
    dialog.current?.close();
  }

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const wrap = event.shiftKey && document.activeElement === close.current ? last.current
      : !event.shiftKey && document.activeElement === last.current ? close.current : null;
    if (!wrap) return;
    event.preventDefault();
    wrap.focus();
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-pill-choice
      data-lenis-prevent
      aria-labelledby="pill-choice-title"
      onClose={afterClose}
      onCancel={event => { event.preventDefault(); requestClose(); }}
      onKeyDown={trapFocus}
      onClick={event => { if (event.target === event.currentTarget) requestClose(); }}
    >
      <div ref={veil} className={styles.veil} aria-hidden="true" />
      <div ref={panel} className={styles.panel}>
        <div ref={surface} className={styles.surface} aria-hidden="true" />
        <button ref={close} type="button" className={styles.close} aria-label="Close pill choice" onClick={requestClose}>×</button>
        <div ref={portrait} className={styles.portrait}>
          <Image src="/images/closing-portrait.png" alt="" width={1086} height={1448} sizes="(max-width:600px) 114px, 225px" loading="eager" />
        </div>
        <div ref={copy} className={styles.copy}>
          <p className={styles.kicker}>SIGNAL RUN / ENTRY POINT</p>
          <h2 id="pill-choice-title">Choose your <em>pill.</em></h2>
          {declined ? (
            <div ref={feedback} className={styles.feedback} tabIndex={-1}>
              <p role="status">You missed the opportunity.</p>
              <button ref={last} type="button" onClick={requestClose}>Return to the portfolio <span aria-hidden="true">↗</span></button>
            </div>
          ) : (
            <div className={styles.actions}>
              <Link href="/play/" prefetch={false} className={styles.red} onClick={enterGame}>
                Red pill <span aria-hidden="true">↗</span><small>Enter the game</small>
              </Link>
              <button ref={last} type="button" className={styles.blue} onClick={decline}>
                Blue pill <span aria-hidden="true">←</span><small>Return to the portfolio</small>
              </button>
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
