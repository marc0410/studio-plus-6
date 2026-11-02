'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { showcaseTokens, type ShowcaseStage } from '@/data/showcase-tokens';
import { setScrollRuntime } from './scrollRuntime';

export function useScrollScatter(section: RefObject<HTMLElement | null>, reducedMotion: boolean, extendSearchStage: (timeline: gsap.core.Timeline, root: HTMLElement) => void) {
  useEffect(() => {
    const root = section.current;
    // Touch devices keep the browser's native vertical scroll. Lenis + a
    // pinned 100dvh scene is useful on desktop, but it creates competing
    // scroll containers on small screens and can swallow diagonal swipes.
    const touchLayout = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
    if (!root || reducedMotion || touchLayout) return;
    gsap.registerPlugin(ScrollTrigger);
    // Keep wheel response direct; a long Lenis duration combined with a scrubbed
    // pinned timeline makes the whole page feel as if it is dragging behind.
    const lenis = new Lenis({ duration: 0.55, smoothWheel: true });
    // The Hero snap controller pauses this same Lenis instance while it owns
    // the wheel, then resumes it once the pinned Showcase is reached.
    setScrollRuntime(lenis);
    const syncScroll = () => ScrollTrigger.update();
    const tick = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', syncScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    let navigate: ((event: Event) => void) | undefined;
    let refreshTimer = 0;
    const context = gsap.context(() => {
      const objects = gsap.utils.toArray<HTMLElement>('[data-table-item]', root);
      const table = root.querySelector<HTMLElement>('.table-surface');
      const copy = root.querySelector<HTMLElement>('.table-copy');
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          id: 'showcase-pin',
          start: 'top top',
          // The five scene stops share one pin. Adjust the duration in showcase-tokens.ts.
          end: () => window.innerWidth < 700 ? showcaseTokens.motion.mobilePinDistance : showcaseTokens.motion.pinDistance,
          pin: true,
          scrub: 0.2,
          invalidateOnRefresh: true,
        },
      });

      // Every object moves along its own outward vector; depth increases its travel and zoom.
      objects.forEach((element) => {
        const depth = Number(element.dataset.depth || 3);
        const vectorX = Number(element.dataset.exitX || 1);
        const vectorY = Number(element.dataset.exitY || 1);
        timeline.to(element, {
          x: () => vectorX * (window.innerWidth * (.48 + depth * .105)),
          y: () => vectorY * (window.innerHeight * (.46 + depth * .075)),
          rotation: Number(element.dataset.rotation || 0) + vectorX * (8 + depth * 2),
          scale: 1 + depth * .11,
          autoAlpha: 0,
          ease: 'none',
          duration: 1,
        }, 0);
      });
      // Avoid animating CSS filters on the full-screen tabletop during scroll;
      // transforms stay on the compositor and keep the pinned scene responsive.
      if (table) timeline.to(table, { scale: 1.36, ease: 'none', duration: 1 }, 0);
      if (copy) timeline.to(copy, { y: -40, autoAlpha: 0, ease: 'none', duration: .63 }, .12);

      // Append the remaining Showcase stops to the existing pin and master timeline.
      extendSearchStage(timeline, root);

      // The floating navigation seeks timeline labels through the same Lenis instance.
      navigate = (event: Event) => {
        const stage = (event as CustomEvent<ShowcaseStage>).detail;
        const trigger = ScrollTrigger.getById('showcase-pin');
        if (!trigger || !stage) return;
        const destination = trigger.labelToScroll(stage);
        if (Number.isFinite(destination)) lenis.scrollTo(destination, { duration: .9 });
      };
      window.addEventListener('showcase:navigate', navigate);

      // A short load-in gives the still collage a tactile, placed-on-the-table feeling.
      gsap.fromTo(objects.map((node) => node.querySelector('.table-object-button')).filter(Boolean),
        { y: (i) => (i % 2 ? -34 : 34), scale: .86, autoAlpha: 0 },
        { y: 0, scale: 1, autoAlpha: 1, duration: .9, stagger: .025, ease: 'back.out(1.2)', delay: .12, clearProps: 'transform,opacity,visibility' },
      );
      const refresh = () => ScrollTrigger.refresh();
      const scheduleRefresh = () => {
        window.clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(refresh, 120);
      };
      root.querySelectorAll('img').forEach((image) => {
        if (!image.complete) { image.addEventListener('load', scheduleRefresh, { once: true }); image.addEventListener('error', scheduleRefresh, { once: true }); }
      });
      requestAnimationFrame(refresh);
    }, root);
    return () => { if (navigate) window.removeEventListener('showcase:navigate', navigate); window.clearTimeout(refreshTimer); context.revert(); lenis.off('scroll', syncScroll); lenis.destroy(); gsap.ticker.remove(tick); setScrollRuntime(null); };
  }, [section, reducedMotion, extendSearchStage]);
}
