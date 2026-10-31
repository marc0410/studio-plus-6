'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import gsap from 'gsap';

const frames = [
  { title: 'Le portrait', kind: 'Photographie', image: 'portrait.webp', position: '58% 38%', alt: 'Portrait photographié par Studio Plus' },
  { title: 'La conversation', kind: 'Podcast vidéo', image: 'studio-session.webp', position: '26% 45%', alt: 'Invitée lors d’une conversation filmée au studio' },
  { title: 'Sur le plateau', kind: 'Production', image: 'studio-backstage.webp', position: '63% 48%', alt: 'Tournage en cours dans le studio' },
  { title: 'Le son', kind: 'Création sonore', image: 'hero-microphone.webp', position: '48% 50%', alt: 'Microphone du studio éclairé en rouge' },
  { title: 'Devant l’objectif', kind: 'Photographie', image: 'portrait.webp', position: '45% 68%', alt: 'Autre cadrage d’un portrait réalisé au studio' },
  { title: 'La rencontre', kind: 'Podcast vidéo', image: 'studio-session.webp', position: '75% 45%', alt: 'Deux personnes échangent devant les caméras' },
  { title: 'En coulisses', kind: 'Production', image: 'studio-backstage.webp', position: '22% 70%', alt: 'Équipe de production pendant un tournage' },
  { title: 'Une voix', kind: 'Podcast', image: 'studio-session.webp', position: '62% 58%', alt: 'Conversation enregistrée au Studio Plus' },
  { title: 'La lumière', kind: 'Photographie', image: 'portrait.webp', position: '67% 25%', alt: 'Détail d’un portrait réalisé au studio' },
  { title: 'La prise', kind: 'Production', image: 'studio-backstage.webp', position: '42% 35%', alt: 'Matériel et équipe sur le plateau' },
] as const;

const step = 360 / frames.length;

export function TrustedBy() {
  const ringRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const dragRef = useRef<{ x: number; angle: number; pointerId: number } | null>(null);
  const [active, setActive] = useState(0);

  const updateParallax = (angle: number) => {
    ringRef.current?.querySelectorAll<HTMLElement>('.trust-card-media').forEach((media, index) => {
      const relative = (angle + index * step) * Math.PI / 180;
      gsap.set(media, { x: Math.sin(relative) * -20 });
    });
  };

  const turnTo = (index: number) => {
    const normalized = (index + frames.length) % frames.length;
    const target = -normalized * step + 360 * Math.round((angleRef.current + normalized * step) / 360);
    angleRef.current = target;
    setActive(normalized);
    gsap.to(ringRef.current, {
      rotationY: target,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.75,
      ease: 'power3.out',
      overwrite: 'auto',
      onUpdate: () => updateParallax(gsap.getProperty(ringRef.current, 'rotationY') as number),
    });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    dragRef.current = { x: event.clientX, angle: angleRef.current, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    gsap.killTweensOf(ringRef.current);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const angle = drag.angle + (event.clientX - drag.x) * 0.28;
    angleRef.current = angle;
    gsap.set(ringRef.current, { rotationY: angle });
    updateParallax(angle);
  };

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    const nearest = Math.round(angleRef.current / step);
    turnTo(((-nearest % frames.length) + frames.length) % frames.length);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); turnTo(active + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); turnTo(active - 1); }
  };

  return (
    <section className="trust-section" aria-labelledby="trust-title" data-scene>
      <div className="trust-copy">
        <span className="section-index">Visages & rencontres</span>
        <h2 id="trust-title">Ils nous ont fait <em>confiance.</em></h2>
      </div>

      <div className="trust-gallery">
        <div
          className="trust-stage"
          role="group"
          aria-label="Galerie 3D des portraits et tournages Studio Plus. Utilisez les flèches du clavier ou faites glisser pour la parcourir."
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="trust-ring" ref={ringRef}>
            {frames.map((frame, index) => (
              <div className="trust-card" key={`${frame.title}-${index}`} style={{ transform: `rotateY(${index * step}deg) translateZ(var(--trust-radius))` }} aria-hidden="true">
                <div className="trust-card-media"><Image src={`/studio/assets/${frame.image}`} alt={frame.alt} fill sizes="(max-width: 620px) 145px, 240px" style={{ objectPosition: frame.position }} /></div>
              </div>
            ))}
          </div>
          <div className="trust-stage-vignette" aria-hidden="true" />
        </div>
        <div className="trust-gallery-footer">
          <div className="trust-caption" aria-live="polite"><span>0{active + 1} / 0{frames.length} · {frames[active].kind}</span><strong>{frames[active].title}</strong></div>
          <div className="trust-controls"><button type="button" onClick={() => turnTo(active - 1)} aria-label="Image précédente">←</button><span>Glisser pour explorer</span><button type="button" onClick={() => turnTo(active + 1)} aria-label="Image suivante">→</button></div>
        </div>
      </div>
    </section>
  );
}
