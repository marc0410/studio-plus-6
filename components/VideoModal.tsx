'use client';

import { useEffect, useRef } from 'react';

type VideoItem = { title: string; category: string; src: string; poster: string };
export function VideoModal({ item, onClose }: { item: VideoItem | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (item && !el.open) el.showModal();
    if (!item && el.open) el.close();
    return () => { if (el.open) el.close(); };
  }, [item]);
  return <dialog ref={dialog} className="film-modal" onClose={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }} aria-label={item?.title ?? 'Vidéo'}>
    {item && <div className="film-modal-inner"><button className="film-modal-close" onClick={onClose} aria-label="Fermer la vidéo">×</button><video key={item.src} src={item.src} poster={item.poster} controls autoPlay playsInline /><div><span>{item.category}</span><h3>{item.title}</h3></div></div>}
  </dialog>;
}
