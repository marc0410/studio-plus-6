'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const statements = [
  {
    number: '01 / L’image',
    visible: 'Vous avez l’idée.',
    revealed: 'Nous créons l’image.',
    detail: 'Photographie et vidéo',
  },
  {
    number: '02 / La voix',
    visible: 'Vous avez la voix.',
    revealed: 'Nous lui donnons l’écho.',
    detail: 'Podcast et production sonore',
  },
];

function StatementContent({ revealed = false }: { revealed?: boolean }) {
  return (
    <div className="mask-story-content">
      <div className="mask-story-heading">
        <span className="section-index">Du premier mot à la dernière image</span>
        <span className="mask-story-hint">{revealed ? 'Studio Plus / Abidjan' : 'Passez la souris pour révéler'}</span>
      </div>

      <div className="mask-story-statements">
        {statements.map((statement, index) => (
          <div className="mask-story-row" key={statement.number}>
            <div className="mask-story-row-meta">
              <span>{statement.number}</span>
              <span>{statement.detail}</span>
            </div>
            {revealed ? (
              <p className="mask-story-title">{statement.revealed}</p>
            ) : (
              <>
                <h2 className="mask-story-title" id={index === 0 ? 'mask-story-title' : undefined}>{statement.visible}</h2>
                <p className="mask-story-mobile-reveal">{statement.revealed}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mask-story-bottom">
        <p>{revealed ? 'Une équipe pour donner forme à ce que vous avez à raconter.' : 'Photo, vidéo, podcast : le bon format pour raconter ce qui compte.'}</p>
        {revealed ? (
          <span className="mask-story-link" aria-hidden="true">Parlons de votre projet <span>↗</span></span>
        ) : (
          <Link className="mask-story-link" href="/reserver">Parlons de votre projet <span aria-hidden="true">↗</span></Link>
        )}
      </div>
    </div>
  );
}

export function SpotlightStatement() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    const section = sectionRef.current;
    const reveal = section?.querySelector<HTMLElement>('.mask-story-reveal');
    if (!section || !reveal) return;

    const media = gsap.matchMedia();
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      let currentSize = 0;
      let pointerX = 0;
      let pointerY = 0;
      let pointerInside = false;

      const position = () => {
        const bounds = reveal.getBoundingClientRect();
        reveal.style.setProperty('--mask-x', `${pointerX - bounds.left}px`);
        reveal.style.setProperty('--mask-y', `${pointerY - bounds.top}px`);
      };

      const onEnter = (event: PointerEvent) => {
        pointerInside = true;
        pointerX = event.clientX;
        pointerY = event.clientY;
        position();
        currentSize = 155;
        gsap.to(reveal, { '--mask-size': '155px', duration: 0.6, ease: 'back.out(1.4)', overwrite: 'auto' });
      };

      const onMove = (event: PointerEvent) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        position();
        const target = event.target instanceof Element ? event.target : null;
        const nextSize = target?.closest('.mask-story-row') ? 225 : 155;
        if (nextSize === currentSize) return;
        currentSize = nextSize;
        gsap.to(reveal, { '--mask-size': `${nextSize}px`, duration: 0.55, ease: 'power3.out', overwrite: 'auto' });
      };

      const onLeave = () => {
        pointerInside = false;
        currentSize = 0;
        gsap.to(reveal, { '--mask-size': '0px', duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      };

      const onScroll = () => {
        if (pointerInside) position();
      };

      section.addEventListener('pointerenter', onEnter);
      section.addEventListener('pointermove', onMove, { passive: true });
      section.addEventListener('pointerleave', onLeave);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);

      return () => {
        section.removeEventListener('pointerenter', onEnter);
        section.removeEventListener('pointermove', onMove);
        section.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        gsap.killTweensOf(reveal);
      };
    });

    return () => media.revert();
  }, { scope: sectionRef });

  return (
    <section className="mask-story" ref={sectionRef} aria-labelledby="mask-story-title" data-scene>
      <StatementContent />
      <div className="mask-story-reveal" aria-hidden="true"><StatementContent revealed /></div>
      <span className="mask-story-mobile-note">Studio Plus donne forme et voix à vos idées.</span>
    </section>
  );
}
