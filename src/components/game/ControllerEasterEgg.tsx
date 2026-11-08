'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { lockPage } from '@/lib/page-lock';
import { findControllerSpot, type ControllerSpot } from './controller-position';
import styles from './ControllerEasterEgg.module.scss';

const GameInviteMotion = dynamic(() => import('./GameInviteMotion'), { ssr: false });
const sticker = '/controller-sticker.webp';
const between = (min: number, max: number) => min + Math.random() * (max - min);
const controls = 'a[href], button, input, select, textarea, [contenteditable]:not([contenteditable="false"]), [role="application"]';
const inviteEvent = 'portfolio:game-invite';

export function PlayerInvite({ className }: { className: string }) {
  return (
    <button
      type="button"
      className={className}
      aria-haspopup="dialog"
      aria-controls="game-invite"
      onClick={event => document.dispatchEvent(new CustomEvent(inviteEvent, { detail: event.currentTarget }))}
    >
      PLAYER_01 <i aria-hidden="true" /> PIYUSH RAJPUT
    </button>
  );
}

export default function ControllerEasterEgg() {
  const [spot, setSpot] = useState<ControllerSpot | null>(null);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const play = useRef<HTMLAnchorElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const openedBy = useRef<HTMLButtonElement | null>(null);
  const unlock = useRef<((restorePosition: boolean) => void) | null>(null);
  const retireAfterInvite = useRef<(() => void) | null>(null);
  const leaving = useRef(false);

  const showInvitation = useCallback((source: HTMLButtonElement) => {
    if (!dialog.current || document.querySelector('dialog[open]')) return;
    leaving.current = false;
    openedBy.current = source;
    unlock.current = lockPage();
    dialog.current.showModal();
    setOpen(true);
  }, []);

  useEffect(() => {
    if (open) cancel.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    let timer: number | undefined;
    let lastActivity = performance.now();
    let visible = false;
    let expired = false;

    const schedule = (callback: () => void, delay: number) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(callback, delay);
    };
    const dismiss = () => {
      visible = false;
      expired = false;
      setSpot(null);
      schedule(discover, between(55_000, 90_000));
    };
    const settle = () => {
      if (!expired || dialog.current?.open || trigger.current?.matches(':hover, :focus-visible')) return;
      dismiss();
    };
    const expire = () => { expired = true; settle(); };

    function discover() {
      const focused = document.activeElement;
      if (document.hidden || performance.now() - lastActivity < 1800 ||
          focused?.closest(controls) || document.querySelector('dialog[open]')) {
        schedule(discover, between(6500, 10_000));
        return;
      }
      const candidate = findControllerSpot();
      if (!candidate) {
        schedule(discover, between(8500, 14_000));
        return;
      }
      visible = true;
      expired = false;
      setSpot(candidate);
      schedule(expire, between(9000, 14_000));
    }

    const activity = (event: Event) => {
      lastActivity = performance.now();
      if (!visible || dialog.current?.open) return;
      const outside = !(event.target instanceof Node && trigger.current?.contains(event.target));
      if (event.type === 'scroll' || event.type === 'resize' || document.hidden ||
          (event.type === 'pointerdown' && outside)) dismiss();
    };
    const checkRelease = () => { if (expired) schedule(settle, 0); };
    const invitePlayer = (event: Event) => {
      const source = (event as CustomEvent<HTMLButtonElement>).detail;
      if (source instanceof HTMLButtonElement) showInvitation(source);
    };
    document.addEventListener(inviteEvent, invitePlayer);
    document.addEventListener('pointerdown', activity, { passive: true, capture: true });
    document.addEventListener('keydown', activity, true);
    document.addEventListener('focusout', checkRelease);
    document.addEventListener('pointerout', checkRelease, { passive: true });
    document.addEventListener('visibilitychange', activity);
    window.addEventListener('scroll', activity, { passive: true });
    window.addEventListener('resize', activity, { passive: true });
    retireAfterInvite.current = () => schedule(expire, 1300);
    schedule(discover, between(10_000, 16_000));

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener(inviteEvent, invitePlayer);
      document.removeEventListener('pointerdown', activity, true);
      document.removeEventListener('keydown', activity, true);
      document.removeEventListener('focusout', checkRelease);
      document.removeEventListener('pointerout', checkRelease);
      document.removeEventListener('visibilitychange', activity);
      window.removeEventListener('scroll', activity);
      window.removeEventListener('resize', activity);
      retireAfterInvite.current = null;
      unlock.current?.(false);
      unlock.current = null;
    };
  }, [showInvitation]);

  function closeInvitation() {
    setOpen(false);
    unlock.current?.(!leaving.current);
    unlock.current = null;
    if (!leaving.current) {
      openedBy.current?.focus({ preventScroll: true });
      if (openedBy.current === trigger.current) retireAfterInvite.current?.();
    }
    openedBy.current = null;
  }

  function enterGame(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    leaving.current = true;
    unlock.current?.(false);
    unlock.current = null;
    dialog.current?.close();
  }

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    const wrap = event.shiftKey && document.activeElement === play.current ? cancel.current :
      !event.shiftKey && document.activeElement === cancel.current ? play.current : null;
    if (!wrap) return;
    event.preventDefault();
    wrap.focus();
  }

  return (
    <>
      {spot && <button
        ref={trigger}
        type="button"
        aria-label="Discover a hidden game"
        aria-haspopup="dialog"
        className={styles.trigger}
        data-controller-discovery
        style={{ left: spot.x, top: spot.y, width: spot.size, height: spot.size }}
        onClick={event => showInvitation(event.currentTarget)}
      >
        <Image src={sticker} alt="" width={384} height={384} loading="eager" unoptimized />
      </button>}
      <dialog
        ref={dialog}
        id="game-invite"
        data-game-invite
        data-lenis-prevent
        className={styles.invite}
        aria-labelledby="game-invite-title"
        aria-describedby="game-invite-description"
        onClose={closeInvitation}
        onKeyDown={trapFocus}
      >
        {(spot || open) && <div className={styles.panel}>
          <div className={styles.eyebrow}><i aria-hidden="true" /> SIGNAL RUN / ARCADE</div>
          <Image className={styles.sticker} src={sticker} alt="" width={384} height={384} loading="eager" unoptimized />
          <h2 id="game-invite-title">Want to play <span className="serif">a game?</span></h2>
          <p id="game-invite-description">Signal Run is ready. Jump over Error Bots and gaps, and see how far you can go.</p>
          <div className={styles.actions}>
            <Link ref={play} href="/play/" prefetch={false} className={styles.play} onClick={enterGame}>YES, LET&apos;S PLAY <span aria-hidden="true">↗</span></Link>
            <button ref={cancel} type="button" className={styles.cancel} onClick={() => dialog.current?.close()}>MAYBE LATER</button>
          </div>
        </div>}
      </dialog>
      {(spot || open) && <GameInviteMotion trigger={trigger} dialog={dialog} open={open} />}
    </>
  );
}
