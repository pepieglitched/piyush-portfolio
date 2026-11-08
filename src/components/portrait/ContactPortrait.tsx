'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const PillChoice = dynamic(() => import('./PillChoice'), { ssr: false });

export default function ContactPortrait({ className, maskClassName }: {
  className: string;
  maskClassName: string;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [choosing, setChoosing] = useState(false);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={className}
        data-contact-stamp
        aria-haspopup="dialog"
        aria-label="Choose your pill"
        onClick={() => setChoosing(true)}
      >
        <span className={maskClassName} data-contact-mask>
          <Image src="/images/closing-portrait.png" alt="Piyush Rajput in a black-and-white halftone portrait with sunglasses and a light polo shirt" width={1086} height={1448} sizes="(max-width:700px) 72px, 166px" />
        </span>
      </button>
      {choosing && createPortal(
        <PillChoice trigger={trigger} onDismiss={() => setChoosing(false)} />,
        document.body,
      )}
    </>
  );
}
