'use client';

import { useCallback } from 'react';
import gsap from 'gsap';
import type { ShowcaseStage } from '@/data/showcase-tokens';
import { showcaseTokens } from '@/data/showcase-tokens';
import { useSearchStage } from '@/components/useSearchStage';
import { useStudioStage } from './useStudioStage';
import { useCraftStage } from './useCraftStage';
import { useMomentsStage } from './useMomentsStage';
import { useFinalCutStage } from './useFinalCutStage';
import { getVisibleShowcaseStages, pausedShowcaseStages } from '@/data/design-tokens';

const visibleStages = getVisibleShowcaseStages();
const stageTimes: Array<{ id: ShowcaseStage; from: number; to: number }> = visibleStages.map((stage, index) => ({
  id: stage.id,
  from: visibleStages.slice(0, index).reduce((sum, prior) => sum + prior.duration, 0),
  to: stage.duration === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : visibleStages.slice(0, index + 1).reduce((sum, prior) => sum + prior.duration, 0),
}));

export function useShowcaseTimeline(onReadyChange: (ready: boolean) => void, onStageChange: (stage: ShowcaseStage) => void) {
  const search = useSearchStage();
  const studio = useStudioStage();
  const craft = useCraftStage();
  const moments = useMomentsStage();
  const finalCut = useFinalCutStage();

  return useCallback((timeline: gsap.core.Timeline, root: HTMLElement) => {
    search(timeline, root);
    if (!pausedShowcaseStages.includes('studio')) studio(timeline, root);
    if (!pausedShowcaseStages.includes('craft')) craft(timeline, root);
    if (!pausedShowcaseStages.includes('moments')) moments(timeline, root);
    finalCut(timeline, root);

    const surface = root.querySelector<HTMLElement>('.table-surface');
    if (surface) {
      const cameraMotion: Partial<Record<ShowcaseStage, gsap.TweenVars>> = {
        studio: { xPercent: -2, yPercent: -2, scale: showcaseTokens.motion.cameraZoom - .02 },
        craft: { xPercent: 2, yPercent: -3, scale: showcaseTokens.motion.cameraZoom },
        moments: { xPercent: 1, yPercent: 2, scale: showcaseTokens.motion.cameraZoom - .02 },
        finalcut: { xPercent: 0, yPercent: 0, scale: showcaseTokens.motion.cameraZoom + .02 },
      };
      visibleStages.filter(({ id }) => id !== 'search').forEach(({ id }) => {
        const motion = cameraMotion[id];
        if (motion) timeline.to(surface, { ...motion, duration: id === 'finalcut' ? .75 : .6, ease: 'none' }, id);
      });
    }

    let lastStage: ShowcaseStage | null = null;
    let lastReady = false;
    const priorUpdate = timeline.eventCallback('onUpdate') as (() => void) | null;
    timeline.eventCallback('onUpdate', () => {
      priorUpdate?.();
      const time = timeline.time();
      const active = stageTimes.find((stage) => time >= stage.from && time < stage.to)?.id ?? 'finalcut';
      const ready = active === 'search' && time >= 2.12;
      if (ready !== lastReady) {
        lastReady = ready;
        const searchStage = root.querySelector<HTMLElement>('[data-search-stage]');
        const searchInput = searchStage?.querySelector<HTMLInputElement>('.file-search-bar input');
        if (searchInput) searchInput.disabled = !ready;
        if (searchStage) {
          searchStage.inert = !ready;
          searchStage.style.pointerEvents = ready ? 'auto' : 'none';
        }
        onReadyChange(ready);
      }
      if (active !== lastStage) {
        lastStage = active;
        root.dataset.stage = active;
        root.querySelectorAll<HTMLElement>('[data-showcase-panel]').forEach((panel) => {
          panel.setAttribute('aria-hidden', String(panel.dataset.showcasePanel !== active));
          panel.inert = panel.dataset.showcasePanel !== active;
        });
        onStageChange(active);
      }
    });
  }, [search, studio, craft, moments, finalCut, onReadyChange, onStageChange]);
}
