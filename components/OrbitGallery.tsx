'use client';

import { useRef, useState, type PointerEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';

const orbitFrames = [
  { title: 'Le portrait', type: 'Photographie', image: 'portrait.webp', alt: 'Portrait réalisé au Studio Plus' },
  { title: 'Le plateau', type: 'Production', image: 'studio-backstage.webp', alt: 'Équipe et matériel sur le plateau' },
  { title: 'La conversation', type: 'Podcast', image: 'studio-session.webp', alt: 'Conversation filmée au studio' },
  { title: 'Le son', type: 'Audio', image: 'hero-microphone.webp', alt: 'Microphone éclairé en rouge' },
  { title: 'La signature', type: 'Identité', image: 'business-card.webp', alt: 'Carte de visite Studio Plus' },
  { title: 'Les détails', type: 'Direction artistique', image: 'stationery.webp', alt: 'Papeterie de l’identité Studio Plus' },
] as const;

const step = 360 / orbitFrames.length;

export function OrbitGallery() {
  const ringRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const dragRef = useRef<{ x: number; angle: number; pointerId: number } | null>(null);
  const [active, setActive] = useState(0);

  const animateTo = (index: number) => {
    const normalized = (index + orbitFrames.length) % orbitFrames.length;
    const target = -normalized * step + 360 * Math.round((angleRef.current + normalized * step) / 360);
    angleRef.current = target;
    setActive(normalized);
    gsap.to(ringRef.current, { rotationY: target, duration: 0.85, ease: 'power3.out', overwrite: true });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)').matches) return;
    dragRef.current = { x: event.clientX, angle: angleRef.current, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    gsap.killTweensOf(ringRef.current);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    angleRef.current = drag.angle + (event.clientX - drag.x) * 0.28;
    gsap.set(ringRef.current, { rotationY: angleRef.current });
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    const nearest = Math.round(angleRef.current / step);
    const target = nearest * step;
    angleRef.current = target;
    setActive(((-nearest % orbitFrames.length) + orbitFrames.length) % orbitFrames.length);
    gsap.to(ringRef.current, { rotationY: target, duration: 0.65, ease: 'power3.out', overwrite: true });
  };

  return (
    <section className="orbit-section" aria-labelledby="orbit-title" data-scene>
      <div className="orbit-heading">
        <div><span className="section-index">Six façons de voir plus loin</span><h2 id="orbit-title">Le studio,<br /><em>sous tous les angles.</em></h2></div>
        <p>Explorez les images. Chaque projet révèle une autre facette de notre travail.</p>
      </div>
      <div className="orbit-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
        <div className="orbit-ring" ref={ringRef}>
          {orbitFrames.map((frame, index) => (
            <div className="orbit-card" key={frame.title} style={{ transform: `rotateY(${index * step}deg) translateZ(470px)` }}>
              <Image src={`/studio/assets/${frame.image}`} alt={frame.alt} fill sizes="(max-width: 900px) 72vw, 420px" />
              <span>STUDIO+ / 0{index + 1}</span>
              <strong>{frame.title}</strong>
            </div>
          ))}
        </div>
        <div className="orbit-vignette" aria-hidden="true" />
      </div>
      <div className="orbit-controls">
        <div className="orbit-caption" aria-live="polite"><span>0{active + 1} / 0{orbitFrames.length} · {orbitFrames[active].type}</span><h3>{orbitFrames[active].title}</h3></div>
        <div className="orbit-buttons"><button type="button" onClick={() => animateTo(active - 1)} aria-label="Image précédente">←</button><span>Glisser pour tourner</span><button type="button" onClick={() => animateTo(active + 1)} aria-label="Image suivante">→</button></div>
        <Link className="text-link" href="/projets">Voir les projets <span aria-hidden="true">↗</span></Link>
      </div>
    </section>
  );
}
