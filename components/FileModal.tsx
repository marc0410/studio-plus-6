'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { SearchFile } from '@/data/objects';

export function FileModal({ item, onClose }: { item: SearchFile | null; onClose: () => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  const reduceMotion = useReducedMotion();
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!item) { previousFocus.current?.focus(); return; }
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.querySelector<HTMLElement>('.file-modal-close')?.focus();
    const esc = (event: KeyboardEvent) => { if (event.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [Boolean(item)]);

  return <AnimatePresence>
    {item && <motion.div ref={dialog} className="file-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="file-modal-title" tabIndex={-1}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : .22 }}
      onMouseDown={(event) => { if (event.target === dialog.current) onClose(); }}
      onKeyDown={(event) => {
        if (event.key !== 'Tab' || !dialog.current) return;
        const focusable = Array.from(dialog.current.querySelectorAll<HTMLElement>('button, audio[controls], video[controls], [tabindex="0"]')).filter((node) => !node.hasAttribute('disabled'));
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <motion.div className="file-modal-panel" initial={{ y: reduceMotion ? 0 : 18, scale: reduceMotion ? 1 : .97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 10, scale: .98 }} transition={{ type: 'spring', stiffness: 260, damping: 27 }}>
        <button className="file-modal-close" onClick={onClose} aria-label="Fermer">×</button>
        <motion.div className="file-modal-media" layoutId={`file-preview-${item.id}`}>
          {item.type === 'video' ? <video src={item.src} poster={item.poster} controls playsInline autoPlay /> : item.type === 'audio' ? <div className="file-modal-audio"><img src={item.poster} alt=""/><audio src={item.src} controls autoPlay /></div> : item.type === 'doc' ? <div className="file-modal-document"><img src={item.poster} alt="Aperçu du document"/><div><b>STUDIO+ / NOTE DE PRODUCTION</b><h3>{item.content.title}</h3><p>{item.content.description}</p></div></div> : <img src={item.src} alt={item.content.title} />}
        </motion.div>
        <div className="file-modal-caption"><span>{item.fileName}</span><h2 id="file-modal-title">{item.content.title}</h2><p>{item.content.description}</p><small>Utilisez ← et → pour parcourir les fichiers</small></div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
