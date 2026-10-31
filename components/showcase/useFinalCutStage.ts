'use client';
import { useCallback } from 'react';
import gsap from 'gsap';
import { showcaseTokens } from '@/data/showcase-tokens';
import { usePanelTimeline } from './usePanelTimeline';
import { getShowcaseStagePrevious, getShowcaseStageStart } from '@/data/design-tokens';

export function useFinalCutStage() {
  const panelStage = usePanelTimeline('finalcut', getShowcaseStageStart('finalcut'), getShowcaseStagePrevious('finalcut'));
  return useCallback((timeline: gsap.core.Timeline, root: HTMLElement) => {
    panelStage(timeline, root);
    const shade = root.querySelector<HTMLElement>('[data-finalcut-shade]');
    const reel = root.querySelector<HTMLElement>('[data-finalcut-reel]');
    if (shade) timeline.fromTo(shade, { autoAlpha: 0 }, { autoAlpha: showcaseTokens.motion.finalCutShade, duration: .7, ease: 'none' }, 'finalcut+=0.1');
    if (reel) timeline.fromTo(reel, { xPercent: 25, rotation: -12 }, { xPercent: -20, rotation: -12, duration: 1.05, ease: 'none' }, 'finalcut+=0.12');
  }, [panelStage]);
}
