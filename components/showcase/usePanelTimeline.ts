'use client';

import { useCallback } from 'react';
import gsap from 'gsap';
import { showcaseTokens } from '@/data/showcase-tokens';

export function usePanelTimeline(stage: 'studio' | 'craft' | 'moments' | 'finalcut', at: number, previous?: string) {
  return useCallback((timeline: gsap.core.Timeline, root: HTMLElement) => {
    const panel = root.querySelector<HTMLElement>(`[data-showcase-panel="${stage}"]`);
    if (!panel) return;
    const label = stage;
    timeline.addLabel(label, at);
    if (previous) {
      const prior = previous === 'search' ? root.querySelector<HTMLElement>('[data-search-stage]') : root.querySelector<HTMLElement>(`[data-showcase-panel="${previous}"]`);
      if (prior) timeline.to(prior, { autoAlpha: 0, scale: .97, duration: .28, ease: 'power2.in' }, label);
    }
    timeline.fromTo(panel, { autoAlpha: 0, y: 28, scale: .975 }, { autoAlpha: 1, y: 0, scale: 1, duration: .45, ease: 'power3.out' }, label);
    const objects = gsap.utils.toArray<HTMLElement>('[data-showcase-object]', panel);
    objects.forEach((object, index) => {
      const start = .12 + index * showcaseTokens.motion.cardStagger;
      timeline.fromTo(object,
        { x: Number(object.dataset.enterX || 0) * window.innerWidth * .62, y: Number(object.dataset.enterY || 1) * window.innerHeight * .58, rotation: Number(object.dataset.objectRotation || 0), scale: .82, autoAlpha: 0 },
        { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: .42, ease: 'back.out(1.2)' }, `${label}+=${start}`);
      const fileLabel = object.querySelector<HTMLElement>('.showcase-file-label');
      if (fileLabel) timeline.fromTo(fileLabel, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .15, ease: 'power2.out' }, `${label}+=${start + .43}`);
    });
    const thread = panel.querySelector<SVGPathElement>('[data-process-thread]');
    if (thread) timeline.fromTo(thread, { strokeDashoffset: 1200 }, { strokeDashoffset: 0, duration: .65, ease: 'none' }, `${label}+=0.25`);
  }, [stage, at, previous]);
}
