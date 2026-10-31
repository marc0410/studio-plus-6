'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { INK_ENABLED, inkTokens } from '@/data/inkTokens';

type InkContextValue = { reducedMotion: boolean; mobile: boolean };
const InkContext = createContext<InkContextValue>({ reducedMotion: false, mobile: false });
let sharedObserver: IntersectionObserver | null = null;
gsap.registerPlugin(ScrollTrigger);

function draw(element: HTMLElement, duration: number = inkTokens.circleDuration) {
  element.dataset.inkRuntime = 'true';
  const paths = Array.from(element.querySelectorAll<SVGPathElement>('.ink__path'));
  element.dataset.inkPlayed = 'true';
  paths.forEach((path, index) => {
    const delay = Number(element.dataset.inkDelay || 0) + (path.dataset.inkHead === 'true' ? .15 : index * .12);
    gsap.fromTo(path, { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: Number(element.dataset.inkDuration || duration), delay, ease: path.dataset.inkLinear === 'true' ? 'none' : 'power2.inOut', overwrite: true });
  });
  const label = element.querySelector<HTMLElement>('.ink__label, .ink__word-text');
  if (label) gsap.fromTo(label, { clipPath: 'inset(0 100% 0 0)', opacity: .35 }, { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: .65, delay: Number(element.dataset.inkDelay || 0) + paths.length * .12, ease: 'power2.out', overwrite: true });
}

export function InkProvider({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = matchMedia('(max-width: 760px)');
    const sync = () => { setReducedMotion(reduce.matches); setMobile(narrow.matches); };
    sync(); reduce.addEventListener('change', sync); narrow.addEventListener('change', sync);
    return () => { reduce.removeEventListener('change', sync); narrow.removeEventListener('change', sync); };
  }, []);

  useEffect(() => {
    if (!INK_ENABLED || reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    document.documentElement.dataset.inkHydrated = 'true';
    const breathing = new Map<HTMLElement, gsap.core.Tween>();
    let fontsReady = false;
    const begin = (element: HTMLElement) => {
      element.dataset.inkRuntime = 'true';
      element.querySelectorAll<SVGPathElement>('.ink__path').forEach((path) => { path.style.strokeDashoffset = '1'; path.style.opacity = '0'; });
      draw(element);
    };
    const ensureObserver = () => {
      if (!sharedObserver) sharedObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            if (!element.dataset.inkPlayed) begin(element);
            else if (!breathing.has(element)) breathing.set(element, gsap.to(element, { opacity: .86, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
          } else {
            breathing.get(element)?.kill(); breathing.delete(element); gsap.set(element, { opacity: 1 });
          }
        }
      }, { threshold: 0, rootMargin: `0px 0px -${100 - inkTokens.enterThreshold * 100}% 0px` });
      return sharedObserver;
    };
    const observer = ensureObserver();
    const prepareAndObserve = (el: HTMLElement) => {
      if (!el.dataset.inkPlayed && !el.dataset.inkRuntime) {
        el.dataset.inkRuntime = 'true';
        el.querySelectorAll<SVGPathElement>('.ink__path').forEach((path) => { path.style.strokeDashoffset = '1'; path.style.opacity = '0'; });
        const word = el.querySelector<HTMLElement>('.ink__word-text');
        if (word) { word.style.clipPath = 'inset(0 100% 0 0)'; word.style.opacity = '.35'; }
      }
      observer.observe(el);
    };
    const scan = (node: ParentNode) => node.querySelectorAll<HTMLElement>('[data-ink-trigger="enter"]').forEach(prepareAndObserve);
    const mutation = new MutationObserver((records) => records.forEach((record) => {
      record.removedNodes.forEach((node) => { if (node instanceof HTMLElement) { if (node.matches('[data-ink-trigger="enter"]')) observer.unobserve(node); node.querySelectorAll<HTMLElement>('[data-ink-trigger="enter"]').forEach((el) => observer.unobserve(el)); } });
      record.addedNodes.forEach((node) => { if (fontsReady && node instanceof HTMLElement) { if (node.matches('[data-ink-trigger="enter"]')) prepareAndObserve(node); scan(node); } });
    }));
    mutation.observe(document.body, { childList: true, subtree: true });
    const onReplay = (event: Event) => {
      if (!fontsReady || !(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>('[data-ink-trigger="hover"],[data-ink-trigger="focus"]');
      if (element) draw(element, inkTokens.hoverDuration);
    };
    document.fonts?.ready.then(() => { fontsReady = true; scan(document); ScrollTrigger.refresh(); }).catch(() => { delete document.documentElement.dataset.inkHydrated; });
    let resizeTimer = 0;
    const onResize = () => { window.clearTimeout(resizeTimer); resizeTimer = window.setTimeout(() => { if (fontsReady) ScrollTrigger.refresh(); }, 150); };
    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('pointerenter', onReplay, true); document.addEventListener('focusin', onReplay);
    return () => { mutation.disconnect(); observer.disconnect(); breathing.forEach((tween) => tween.kill()); breathing.clear(); gsap.killTweensOf('.ink__path'); gsap.killTweensOf('.ink__label'); window.clearTimeout(resizeTimer); window.removeEventListener('resize', onResize); sharedObserver = null; delete document.documentElement.dataset.inkHydrated; document.removeEventListener('pointerenter', onReplay, true); document.removeEventListener('focusin', onReplay); };
  }, [reducedMotion]);

  const value = useMemo(() => ({ reducedMotion, mobile }), [reducedMotion, mobile]);
  return <InkContext.Provider value={value}>{children}</InkContext.Provider>;
}

export function useInkContext() { return useContext(InkContext); }
