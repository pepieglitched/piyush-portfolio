'use client';

import Image from 'next/image';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { FocusEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './EvidenceChapter.module.scss';

const CertificateFollower = lazy(() => import('./CertificateFollower'));

export type Certificate = {
  title: string;
  caption: string;
  src: string;
  preview: string;
  width: number;
  height: number;
  alt: string;
};

export type PreviewPoint = { x: number; y: number };
export type PreviewMover = (point: PreviewPoint, snap?: boolean) => void;

function certificateRow(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLElement>('article[data-certificate]') : null;
}

function certificateLink(target: EventTarget | null) {
  return target instanceof Element ? target.closest<HTMLAnchorElement>('a[data-certificate-action]') : null;
}

type Preview = { id: string; visible: boolean };

export function EvidencePreviews({ certificates, children }: {
  certificates: Partial<Record<string, Certificate>>;
  children: ReactNode;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const current = useRef<string | null>(null);
  const previewPoint = useRef<PreviewPoint>({ x: 0, y: 0 });
  const movePreview = useRef<PreviewMover | null>(null);
  const tapRow = useRef<HTMLElement | null>(null);
  const opener = useRef<HTMLAnchorElement | null>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const previewAsset = preview ? certificates[preview.id] : undefined;
  const openAsset = openId ? certificates[openId] : undefined;

  useEffect(() => {
    if (!openAsset || !modal.current || modal.current.open) return;
    modal.current.showModal();
  }, [openAsset]);

  function show(row: HTMLElement | null, point: PreviewPoint) {
    const id = row?.dataset.certificate;
    if (!id || !certificates[id] || openId) return;
    const fromHidden = current.current !== id;
    current.current = id;
    previewPoint.current = point;
    movePreview.current?.(point, fromHidden);
    setPreview(previous => previous?.id === id && previous.visible ? previous : { id, visible: true });
  }

  const hide = useCallback(() => {
    current.current = null;
    setPreview(previous => previous?.visible ? { ...previous, visible: false } : previous);
  }, []);

  useEffect(() => {
    if (!preview?.visible) return;
    const dismiss = (event: KeyboardEvent) => { if (event.key === 'Escape') hide(); };
    document.addEventListener('keydown', dismiss);
    return () => document.removeEventListener('keydown', dismiss);
  }, [hide, preview?.visible]);

  function pointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    const row = certificateRow(event.target);
    if (row && row !== certificateRow(event.relatedTarget)) show(row, { x: event.clientX, y: event.clientY });
  }

  function pointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    const row = certificateRow(event.target);
    if (row && row !== certificateRow(event.relatedTarget)) hide();
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || !current.current) return;
    if (certificateRow(event.target)?.dataset.certificate !== current.current) return;
    const point = { x: event.clientX, y: event.clientY };
    previewPoint.current = point;
    movePreview.current?.(point);
  }

  function focusPreview(event: FocusEvent<HTMLDivElement>) {
    const link = certificateLink(event.target);
    if (!link?.matches(':focus-visible')) return;
    const rect = link.getBoundingClientRect();
    show(certificateRow(link), { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  }

  function activate(event: MouseEvent<HTMLDivElement>) {
    const row = certificateRow(event.target);
    const id = row?.dataset.certificate;
    if (!row || !id || !certificates[id]) return;
    const link = certificateLink(event.target);
    const tapped = tapRow.current === row;
    tapRow.current = null;
    if (!link && !tapped) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener.current = link ?? row.querySelector<HTMLAnchorElement>('a[data-certificate-action]');
    hide();
    setOpenId(id);
  }

  function close() {
    setOpenId(null);
    opener.current?.focus({ preventScroll: true });
    opener.current = null;
  }

  return (
    <>
      <div
        className={styles.milestones}
        onPointerOver={pointerEnter}
        onPointerOut={pointerLeave}
        onPointerMove={pointerMove}
        onPointerDown={event => { tapRow.current = event.pointerType === 'touch' ? certificateRow(event.target) : null; }}
        onPointerCancel={() => { tapRow.current = null; }}
        onFocus={focusPreview}
        onBlur={event => { if (certificateLink(event.target)) hide(); }}
        onClick={activate}
      >
        {children}
      </div>
      {preview && previewAsset && createPortal(
        <Suspense fallback={null}>
          <CertificateFollower
            key={preview.id}
            id={preview.id}
            certificate={previewAsset}
            position={previewPoint}
            moveRef={movePreview}
            visible={preview.visible && !openAsset}
          />
        </Suspense>,
        document.body,
      )}
      <dialog
        ref={modal}
        className={styles.dialog}
        aria-labelledby="certificate-dialog-title"
        aria-describedby="certificate-dialog-caption"
        data-certificate-dialog={openId ?? ''}
        data-lenis-prevent
        onClose={close}
        onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}
      >
        {openAsset && <div className={styles.dialogContent}>
          <div className={styles.dialogHeader}>
            <h2 id="certificate-dialog-title">{openAsset.title}</h2>
            <button type="button" onClick={() => modal.current?.close()} aria-label="Close certificate">×</button>
          </div>
          <Image src={openAsset.src} alt={openAsset.alt} width={openAsset.width} height={openAsset.height} loading="eager" unoptimized />
          <p id="certificate-dialog-caption">{openAsset.caption}</p>
        </div>}
      </dialog>
    </>
  );
}
