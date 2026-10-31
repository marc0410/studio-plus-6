'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Ink } from '@/components/handwriting/Ink';
import { AnimatePresence, motion } from 'motion/react';
import { studioScenes } from '@/lib/site-content';

export function StudioTour() {
  const [scene, setScene] = useState(0);
  const [light, setLight] = useState<'neutral' | 'warm' | 'red'>('neutral');
  const [showNote, setShowNote] = useState(false);
  const current = studioScenes[scene];

  return (
    <section className="section studio-tour" id="plateau" aria-labelledby="plateau-title" data-scene>
      <div className="tour-copy">
        <span className="section-index">Le plateau / Studio Plus</span>
        <h2 id="plateau-title">Entrez dans<br /><Ink type="underline" trigger="enter" color="accent">le champ.</Ink></h2>
        <p>Choisissez un décor. Approchez-vous de la lumière, du son et de ceux qui font l’image.</p>
        <div className="tour-tabs" role="group" aria-label="Choisir un espace du studio">
          {studioScenes.map((item, index) => (
            <button
              type="button"
              key={item.name}
              onClick={() => { setScene(index); setShowNote(false); }}
              aria-pressed={scene === index}
            >
              <span className="tour-number">0{index + 1}</span>
              <span><strong>{item.name}</strong><small>{item.category}</small></span>
              <span className="tour-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tour-stage">
        <figure className="viewfinder" data-light={light}>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.image}
              className="viewfinder-media"
              initial={{ opacity: 0, scale: 1.055, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.985, filter: 'blur(6px)' }}
              transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image src={`/studio/assets/${current.image}`} alt={current.alt} fill sizes="(max-width: 850px) 100vw, 60vw" />
            </motion.div>
          </AnimatePresence>
          <div className="viewfinder-top"><span className="rec">REC</span><span>SP-0{scene + 1} / 00:00:0{scene + 3}:12</span></div>
          <span className="finder-corner finder-tl" /><span className="finder-corner finder-tr" />
          <span className="finder-corner finder-bl" /><span className="finder-corner finder-br" />
          <button className="finder-hotspot" type="button" onClick={() => setShowNote(value => !value)} aria-expanded={showNote} aria-label="Découvrir ce détail du studio"><span>+</span></button>
          <AnimatePresence>
            {showNote && <motion.div className="finder-note" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.25 }}>{current.detail}</motion.div>}
          </AnimatePresence>
          <figcaption className="view-caption"><span>{current.cue}</span><span>Cocody Angré / Abidjan</span></figcaption>
        </figure>
        <div className="light-controls" role="group" aria-label="Ambiance lumineuse">
          <span className="light-controls-label">Lumière</span>
          {([['neutral', 'Originale'], ['warm', 'Chaude'], ['red', 'Rouge']] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setLight(value)} aria-pressed={light === value}><i className={`light-dot ${value}`} />{label}</button>
          ))}
        </div>
      </div>
    </section>
  );
}
