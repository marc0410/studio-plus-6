'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { showcaseStageNames, type ShowcaseStage } from '@/data/showcase-tokens';

export function SectionTitle({ eyebrow, title, emphasis, note, id }: {
  eyebrow: string;
  title: string;
  emphasis?: string;
  note?: string;
  id?: string;
}) {
  return <header className="showcase-title">
    <span className="showcase-title-eyebrow">{eyebrow}</span>
    <h2 id={id}><strong>{title}</strong>{emphasis && <> <span>{emphasis}</span></>}</h2>
    {note && <p>{note}</p>}
  </header>;
}

export function FileLabel({ children }: { children: ReactNode }) {
  return <span className="showcase-file-label">{children}</span>;
}

export function GlassPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`showcase-glass ${className}`.trim()}>{children}</div>;
}

export function PaperCard({ children, fileName, className = '', onClick, label, enterFrom, rotation = 0, depth = 2 }: {
  children: ReactNode;
  fileName: string;
  className?: string;
  onClick: () => void;
  label?: string;
  enterFrom?: { x: number; y: number };
  rotation?: number;
  depth?: number;
}) {
  return <article className={`showcase-paper-card ${className}`.trim()} data-showcase-object data-enter-x={enterFrom?.x ?? 0} data-enter-y={enterFrom?.y ?? 1} data-object-rotation={rotation} data-depth={depth} style={{ '--showcase-rotation': `${rotation}deg` } as CSSProperties}>
    <button type="button" className="showcase-object-button" onClick={onClick} aria-label={label ?? `Ouvrir ${fileName}`}>
      <span className="showcase-parallax" data-parallax data-depth={depth}>
        {children}
        <FileLabel>{fileName}</FileLabel>
      </span>
    </button>
  </article>;
}

export function PolaroidFrame({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return <span className="showcase-polaroid">
    <img src={src} alt={alt} loading="lazy" />
    {caption && <span>{caption}</span>}
  </span>;
}

export function FilmStrip({ src, poster, title, active = false, onPlay, onPause }: {
  src?: string;
  poster: string;
  title: string;
  active?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (!active || !video.current || !src) return;
    void video.current.play().catch(() => {});
    return () => video.current?.pause();
  }, [active, src]);

  return <span className="showcase-film-strip" onPointerEnter={onPlay} onPointerLeave={onPause}>
    <span className="showcase-film-perfs">STUDIO+ 21 <i aria-hidden="true">▪ ▪ ▪ ▪ ▪ ▪</i></span>
    {src ? <video ref={video} src={src} poster={poster} muted loop playsInline preload="metadata" aria-label={title} /> : <img src={poster} alt={title} loading="lazy" />}
    <span className="showcase-film-perfs">▪ ▪ ▪ ▪ ▪ ▪ <i>20A</i></span>
  </span>;
}

export function FolderCard({ children, fileName, onClick, className = '', enterFrom, rotation, depth }: {
  children: ReactNode;
  fileName: string;
  onClick: () => void;
  className?: string;
  enterFrom?: { x: number; y: number };
  rotation?: number;
  depth?: number;
}) {
  return <PaperCard fileName={fileName} onClick={onClick} className={`showcase-folder ${className}`} enterFrom={enterFrom} rotation={rotation} depth={depth}>
    <span className="showcase-folder-tab" aria-hidden="true" />
    <span className="showcase-folder-content">{children}</span>
  </PaperCard>;
}

/** Branded stationery element for use inside the studio tabletop scene. */
export function BrandObject({ kind, title, tone = 'blue' }: { kind: 'classeur' | 'enveloppe' | 'carte' | 'catalogue'; title: string; tone?: 'blue' | 'red' | 'white' }) {
  return <span className={`brand-object brand-object--${kind} brand-object--${tone}`} aria-label={title}>
    <i className="brand-object-pattern" aria-hidden="true"/><b>{title}</b><small>STUDIO+ · ABIDJAN</small>
  </span>;
}

export function FloatingNav({ active, onNavigate }: { active: 'discover' | 'showcase' | 'features'; onNavigate: (target: 'discover' | 'showcase' | 'features') => void }) {
  const items: Array<{ id: 'discover' | 'showcase' | 'features'; label: string }> = [
    { id: 'discover', label: 'Discover' }, { id: 'showcase', label: 'Showcase' }, { id: 'features', label: 'Features' },
  ];
  return <nav className="showcase-floating-nav" aria-label="Navigation Showcase">
    {items.map((item) => <button type="button" key={item.id} aria-current={active === item.id ? 'step' : undefined} onClick={() => onNavigate(item.id)}>{item.label}</button>)}
  </nav>;
}

export function StageDots({ active, onNavigate }: { active: ShowcaseStage; onNavigate: (stage: ShowcaseStage) => void }) {
  const stages = showcaseStageNames;
  return <nav className="showcase-stage-dots" aria-label="Étapes du Showcase">
    {stages.map((stage, index) => <button type="button" key={stage.id} aria-label={`Aller à l’étape ${index + 1} : ${stage.label}`} aria-current={active === stage.id ? 'step' : undefined} onClick={() => onNavigate(stage.id)}><i aria-hidden="true" /> <span>{stage.label}</span></button>)}
  </nav>;
}

export function ObjectModal({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return <dialog ref={dialog} className="showcase-object-modal" aria-label={title} onClose={onClose} onClick={(event) => { if (event.target === dialog.current) onClose(); }}>
    <button type="button" className="showcase-object-modal-close" aria-label="Fermer" onClick={onClose}>×</button>
    <div className="showcase-object-modal-content">{children}</div>
  </dialog>;
}
