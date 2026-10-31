'use client';

import { useCallback } from 'react';
import gsap from 'gsap';
import { typewriterQuery } from '@/data/objects';

export function useSearchStage() {
  return useCallback((timeline: gsap.core.Timeline, root: HTMLElement) => {
    const stage = root.querySelector<HTMLElement>('[data-search-stage]');
    const heading = stage?.querySelector<HTMLElement>('[data-search-heading]');
    const lines = stage?.querySelectorAll<HTMLElement>('.search-heading-line');
    const bar = stage?.querySelector<HTMLElement>('[data-search-bar]');
    const input = stage?.querySelector<HTMLInputElement>('.file-search-bar input');
    const thumb = stage?.querySelector<HTMLElement>('[data-search-thumb]');
    const enter = stage?.querySelector<HTMLElement>('[data-search-enter]');
    const cards = stage ? gsap.utils.toArray<HTMLElement>('[data-search-card]', stage) : [];
    const labels = stage ? gsap.utils.toArray<HTMLElement>('[data-file-label]', stage) : [];
    const edgePieces = stage ? gsap.utils.toArray<HTMLElement>('.search-edge-piece', stage) : [];
    if (!stage || !heading || !lines || !bar || !input) return;

    // Stage 2 begins at timeline time 1, immediately after the existing scatter/zoom stage.
    const table = root.querySelector<HTMLElement>('.table-surface');
    if (table) timeline.to(table, { scale: 1.42, duration: .28, ease: 'power2.out' }, 1);
    timeline.fromTo(stage, { autoAlpha: 0 }, { autoAlpha: 1, duration: .16, ease: 'none' }, .98);
    timeline.fromTo(edgePieces, { autoAlpha: 0, scale: .92 }, { autoAlpha: .86, scale: 1, duration: .28, stagger: .025, ease: 'power2.out' }, 1);
    timeline.fromTo(lines, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .28, stagger: .085, ease: 'power2.out' }, 1.02);
    timeline.fromTo(lines, { y: 20 }, { y: 0, duration: .28, stagger: .085, ease: 'power2.out' }, 1.02);
    timeline.fromTo(bar, { autoAlpha: 0, scale: .95, y: 12 }, { autoAlpha: 1, scale: 1, y: 0, duration: .34, ease: 'power2.out' }, 1.22);

    // Scroll-scrubbed typewriter: no timer and no React render during scroll.
    const typing = { count: 0 };
    let lastTypedCount = -1;
    timeline.to(typing, { count: typewriterQuery.length, duration: .38, snap: { count: 1 }, ease: 'none', onUpdate: () => {
      if (typing.count === lastTypedCount) return;
      lastTypedCount = typing.count;
      input.value = typewriterQuery.slice(0, lastTypedCount);
    } }, 1.56);
    if (thumb) timeline.fromTo(thumb, { autoAlpha: 0, scale: .75 }, { autoAlpha: 1, scale: 1, duration: .16, ease: 'back.out(1.5)' }, 1.94);
    if (enter) timeline.fromTo(enter, { color: '#a4a4a4', backgroundColor: '#ffffff0a', scale: .92 }, { color: '#fff', backgroundColor: '#ee704b', scale: 1, duration: .14 }, 1.96);

    // These starts are the reverse of step 1's outward vectors; depth controls distance.
    timeline.fromTo(cards, { x: (index, element) => Number((element as HTMLElement).dataset.edgeX || -1) * window.innerWidth * .48, y: (index, element) => Number((element as HTMLElement).dataset.edgeY || -1) * window.innerHeight * .42, rotation: (index, element) => Number((element as HTMLElement).dataset.edgeRotation || 0), scale: .79, autoAlpha: 0 }, { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: .52, stagger: .065, ease: 'power3.out' }, 1.4);
    timeline.fromTo(labels, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: .19, stagger: .065, ease: 'power2.out' }, 1.87);
    cards.forEach((card) => {
      const selected = card.dataset.fileId === 'portrait';
      timeline.to(card, selected ? { scale: 1.045, boxShadow: '0 0 0 2px #e87850, 0 14px 28px #14100d55', duration: .18, ease: 'power2.out' } : { autoAlpha: .6, duration: .18, ease: 'none' }, 1.98);
    });

    timeline.addLabel('search', 2.12);
    // Readiness and active-stage state are owned by the master timeline callback.
  }, []);
}
