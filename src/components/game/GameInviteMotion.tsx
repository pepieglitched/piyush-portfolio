'use client';

import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function GameInviteMotion({ trigger, dialog, open }: {
  trigger: RefObject<HTMLButtonElement | null>;
  dialog: RefObject<HTMLDialogElement | null>;
  open: boolean;
}) {
  useGSAP(() => {
    if (!trigger.current) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline()
        .from(trigger.current, { opacity: 0, y: 8, scale: .82, rotation: -11, duration: .42, ease: 'back.out(1.45)' })
        .to(trigger.current, { y: -4, duration: .85, yoyo: true, repeat: 3, ease: 'sine.inOut', clearProps: 'transform' });
    });
    return () => media.revert();
  }, { scope: trigger });

  useGSAP(() => {
    if (!open || !dialog.current) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(dialog.current, { opacity: 0, y: 12, scale: .97, duration: .28, ease: 'power2.out' });
    });
    return () => media.revert();
  }, { scope: dialog, dependencies: [open], revertOnUpdate: true });

  return null;
}
