'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function SceneMotion() {
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo('.hero .hero-copy, .hero .hero-actions', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.16, delay: 0.25, ease: 'power3.out' });
      gsap.utils.toArray<HTMLElement>('.home-page .section-heading h2, .home-page .scene-copy h2, .home-page .process-intro p').forEach((heading) => {
        gsap.fromTo(heading, { y: 34, opacity: 0 }, {
          y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: heading, start: 'top 88%', once: true },
        });
      });

    });

    media.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const section = document.querySelector<HTMLElement>('.reel-section');
      const viewport = section?.querySelector<HTMLElement>('.reel-viewport');
      const track = section?.querySelector<HTMLElement>('.reel-track');
      const progress = section?.querySelector<HTMLElement>('.reel-progress i');
      if (!section || !viewport || !track || !progress) return;

      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => gsap.set(progress, { scaleX: self.progress }),
        },
      });
      const reelImages = gsap.utils.toArray<HTMLElement>('.reel-frame-image img', section);
      if (reelImages.length) gsap.fromTo(reelImages, { xPercent: -7, scale: 1.15 }, {
        xPercent: 7, scale: 1.15, ease: 'none', stagger: 0.12,
        scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: true },
      });
      const reelFrames = gsap.utils.toArray<HTMLElement>('.reel-frame-image', section);
      if (reelFrames.length) gsap.fromTo(reelFrames, { rotateY: (index) => index % 2 === 0 ? -7 : 7 }, {
        rotateY: (index) => index % 2 === 0 ? 5 : -5,
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: true },
      });
    });
    return () => media.revert();
  });

  return null;
}
