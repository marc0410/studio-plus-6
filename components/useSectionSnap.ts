'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import { showcaseTokens } from '@/data/showcase-tokens';
import { getScrollRuntime, subscribeScrollRuntime } from './scrollRuntime';

// Tuning knobs: the Hero/Showcase handoff can be switched off independently;
// mobile keeps the same boundary gesture, with a larger swipe threshold.
const SNAP_ENABLED = true;
const MOBILE_MODE: 'observer' | 'natural' = 'observer';
const DURATION = 1.1;
const EASE = 'power3.inOut';
const TOLERANCE = 12;
const MOBILE_TOLERANCE = 40;
const COOLDOWN_MS = 200;
const SAFETY_LOCK_MS = 2000;
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

type SnapState = 'hero' | 'transitioning' | 'showcase-free' | 'showcase-top';
type SectionSnapOptions = {
  sections: { hero: string; showcase: string };
  onEnter?: (section: 'hero' | 'showcase') => void;
  onLeave?: (section: 'hero' | 'showcase') => void;
};

/** Public helpers for skip links, app navigation and deliberate scroll locks. */
export function goTo(section: string) {
  window.dispatchEvent(new CustomEvent('studio:go-to-section', { detail: section }));
}
export function lockScroll() { getScrollRuntime()?.stop(); }
export function unlockScroll() { getScrollRuntime()?.start(); }

/** Hybrid snap: only the Hero/Showcase edge is captured; Showcase stays free. */
export function useSectionSnap({ sections, onEnter, onLeave }: SectionSnapOptions) {
  const state = useRef<SnapState>('hero');
  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION);
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    if (!SNAP_ENABLED || media.matches || (mobile && MOBILE_MODE === 'natural')) return;

    gsap.registerPlugin(Observer, ScrollToPlugin, ScrollTrigger);
    const hero = document.querySelector<HTMLElement>(sections.hero);
    const showcase = document.querySelector<HTMLElement>(sections.showcase);
    const overlay = document.querySelector<HTMLElement>('.section-snap-transition');
    const flare = overlay?.querySelector<HTMLElement>('.section-snap-flare');
    const heroCopy = hero?.querySelector<HTMLElement>('.hero-inner');
    const heroImage = hero?.querySelector<HTMLElement>('.hero-image');
    if (!hero || !showcase) return;

    const runtime: { lenis: Lenis | null } = { lenis: null };
    const unsubscribeLenis = subscribeScrollRuntime((instance) => {
      runtime.lenis = instance;
      if (state.current === 'hero' || state.current === 'showcase-top') instance?.stop();
      else instance?.start();
    });
    let observer: Observer | null = null;
    let boundary: ScrollTrigger | null = null;
    let timeline: gsap.core.Timeline | null = null;
    let safetyTimer = 0;
    let refreshTimer = 0;
    let unlockedAt = 0;
    let failed = false;
    const root = document.documentElement;
    const originalScrollBehavior = root.style.scrollBehavior;
    const getShowcaseTop = () => showcase.getBoundingClientRect().top + window.scrollY;

    const establishInitialState = () => {
      const top = getShowcaseTop();
      const directHash = Boolean(window.location.hash && window.location.hash !== '#hero');
      const currentY = window.scrollY;
      if (directHash || currentY > top + 2) state.current = 'showcase-free';
      else if (Math.abs(currentY - top) <= 2) state.current = 'showcase-top';
      else state.current = 'hero';
      if (state.current === 'showcase-free') runtime.lenis?.start();
      else runtime.lenis?.stop();
      observer?.[state.current === 'showcase-free' ? 'disable' : 'enable']();
    };
    establishInitialState();

    const refreshAfterLayout = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 80);
    };
    const onLoad = () => refreshAfterLayout();
    window.addEventListener('load', onLoad);
    document.querySelectorAll('img').forEach((image) => {
      if (!image.complete) image.addEventListener('load', refreshAfterLayout, { once: true });
    });
    document.fonts?.ready.then(refreshAfterLayout).catch(() => undefined);

    const cleanTransitionStyles = () => {
      if (heroCopy) gsap.set(heroCopy, { clearProps: 'opacity,transform,visibility' });
      if (heroImage) gsap.set(heroImage, { clearProps: 'transform' });
      if (overlay) gsap.set(overlay, { clearProps: 'opacity,clipPath,visibility' });
      if (flare) gsap.set(flare, { clearProps: 'opacity,transform' });
    };

    const finish = (arrivedAt: 'hero' | 'showcase') => {
      window.clearTimeout(safetyTimer);
      timeline = null;
      root.style.scrollBehavior = originalScrollBehavior;
      cleanTransitionStyles();
      state.current = arrivedAt === 'hero' ? 'hero' : 'showcase-free';
      if (arrivedAt === 'hero') observer?.enable();
      else observer?.disable();
      runtime.lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
      if (arrivedAt === 'showcase') runtime.lenis?.start();
      else runtime.lenis?.stop();
      ScrollTrigger.update();
      ScrollTrigger.refresh();
      unlockedAt = performance.now() + COOLDOWN_MS;
      window.setTimeout(() => { unlockedAt = 0; }, COOLDOWN_MS);
      const focusTarget = arrivedAt === 'hero' ? hero.querySelector<HTMLElement>('#hero-title') : showcase.querySelector<HTMLElement>('#table-title');
      focusTarget?.focus({ preventScroll: true });
      onEnter?.(arrivedAt);
      onLeave?.(arrivedAt === 'hero' ? 'showcase' : 'hero');
    };

    const transition = (arrivedAt: 'hero' | 'showcase') => {
      if (failed || state.current === 'transitioning' || performance.now() < unlockedAt) return;
      const target = arrivedAt === 'hero' ? hero : showcase;
      state.current = 'transitioning';
      observer?.disable();
      runtime.lenis?.stop();
      root.style.scrollBehavior = 'auto';
      timeline?.kill();
      timeline = gsap.timeline({
        defaults: { ease: EASE },
        onComplete: () => finish(arrivedAt),
        onInterrupt: () => {
          root.style.scrollBehavior = originalScrollBehavior;
          if (!failed) finish(window.scrollY < getShowcaseTop() - 2 ? 'hero' : 'showcase');
        },
      });

      if (overlay) gsap.set(overlay, { autoAlpha: 1, clipPath: arrivedAt === 'showcase' ? 'inset(100% 0 0)' : 'inset(0 0 100%)' });
      if (flare) gsap.set(flare, { autoAlpha: 0, xPercent: arrivedAt === 'showcase' ? -22 : 22 });
      if (arrivedAt === 'hero' && heroCopy) gsap.set(heroCopy, { autoAlpha: 0, y: 24 });

      // Scroll and transition curtain share one 1.1s timeline. Effects touch
      // only Hero/transition DOM and never the pinned Showcase master timeline.
      timeline.to(window, { scrollTo: { y: target, autoKill: false }, duration: DURATION, ease: EASE }, 0);
      if (arrivedAt === 'showcase') {
        if (heroCopy) timeline.to(heroCopy, { autoAlpha: 0, y: -18, duration: 0.55 }, 0);
        if (heroImage) timeline.to(heroImage, { scale: 1.055, duration: DURATION }, 0);
        if (overlay) timeline.to(overlay, { clipPath: 'inset(0% 0 0)', duration: 0.58, ease: 'power2.inOut' }, 0.05).to(overlay, { autoAlpha: 0, duration: 0.42 }, 0.62);
        if (flare) timeline.to(flare, { autoAlpha: 0.8, xPercent: 0, duration: 0.3, ease: 'power2.out' }, 0.22).to(flare, { autoAlpha: 0, xPercent: 20, duration: 0.42 }, 0.52);
      } else {
        if (heroImage) timeline.to(heroImage, { scale: 1, duration: DURATION }, 0);
        if (overlay) timeline.to(overlay, { clipPath: 'inset(0)', duration: 0.62, ease: 'power2.inOut' }, 0.08).to(overlay, { autoAlpha: 0, duration: 0.35 }, 0.62);
        if (flare) timeline.to(flare, { autoAlpha: 0.72, xPercent: 0, duration: 0.28 }, 0.28).to(flare, { autoAlpha: 0, xPercent: -20, duration: 0.42 }, 0.58);
        if (heroCopy) timeline.to(heroCopy, { autoAlpha: 1, y: 0, duration: 0.62, ease: 'power2.out' }, 0.44);
      }

      window.clearTimeout(safetyTimer);
      safetyTimer = window.setTimeout(() => {
        failed = true;
        timeline?.kill();
        timeline = null;
        root.style.scrollBehavior = originalScrollBehavior;
        cleanTransitionStyles();
        state.current = window.scrollY < getShowcaseTop() - 2 ? 'hero' : 'showcase-free';
        observer?.disable();
        runtime.lenis?.start();
        delete root.dataset.sectionSnap;
      }, SAFETY_LOCK_MS);
    };

    const isIgnored = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('[data-lenis-prevent],[data-no-snap],dialog,[role="dialog"],input,textarea,select,[contenteditable="true"]'));
    observer = Observer.create({
      target: window,
      type: 'wheel,touch',
      wheelSpeed: -1,
      tolerance: mobile ? MOBILE_TOLERANCE : TOLERANCE,
      preventDefault: true,
      ignoreCheck: (event) => isIgnored(event.target),
      onUp: (self) => {
        if (isIgnored(self.event?.target)) return;
        if (state.current === 'hero') transition('showcase');
        else if (state.current === 'showcase-top') transition('hero');
      },
      onDown: (self) => {
        if (isIgnored(self.event?.target)) return;
        if (state.current === 'showcase-top') {
          state.current = 'showcase-free';
          observer?.disable();
          runtime.lenis?.start();
          runtime.lenis?.scrollTo(window.scrollY + 120, { duration: 0.3 });
        }
      },
    });
    if (state.current === 'showcase-free') observer.disable();

    boundary = ScrollTrigger.create({
      trigger: showcase,
      start: 'top top',
      end: () => `+=${window.innerWidth < 700 ? showcaseTokens.motion.mobilePinDistance : showcaseTokens.motion.pinDistance}`,
      onUpdate: (self) => {
        if (self.progress <= 0.001 && self.direction < 0 && state.current === 'showcase-free') {
          state.current = 'showcase-top';
          runtime.lenis?.stop();
          observer?.enable();
        } else if (state.current === 'showcase-top' && self.progress > 0.001) {
          state.current = 'showcase-free';
          observer?.disable();
          runtime.lenis?.start();
        }
      },
    });

    const handleGoTo = (event: Event) => {
      const destination = (event as CustomEvent<string>).detail;
      if (destination === 'hero' || destination === '#hero') { transition('hero'); return; }
      if (destination === 'showcase' || destination === '#showcase') { transition('showcase'); return; }
      const element = document.querySelector<HTMLElement>(destination.startsWith('#') ? destination : `#${CSS.escape(destination)}`);
      if (!element) return;
      failed = true;
      state.current = 'showcase-free';
      observer?.disable();
      runtime.lenis?.start();
      const finishNavigation = () => { failed = false; ScrollTrigger.refresh(); };
      if (runtime.lenis) runtime.lenis.scrollTo(element, { duration: 0.8, onComplete: finishNavigation });
      else gsap.to(window, { scrollTo: { y: element, autoKill: false }, duration: 0.8, ease: EASE, onComplete: finishNavigation });
    };
    const handleAnchorClick = (event: MouseEvent) => {
      if (failed) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      const id = decodeURIComponent(anchor.hash.slice(1));
      if (!id || !document.getElementById(id)) return;
      event.preventDefault();
      history.pushState(null, '', `#${encodeURIComponent(id)}`);
      goTo(id);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (failed) return;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isIgnored(event.target)) return;
      if (event.key === 'Home') {
        event.preventDefault(); transition('hero'); return;
      }
      if (event.key === 'End') {
        const pricing = document.getElementById('tarifs');
        if (pricing) { event.preventDefault(); goTo('tarifs'); }
        return;
      }
      if (['ArrowDown', 'PageDown', ' '].includes(event.key) && state.current === 'hero') {
        event.preventDefault(); transition('showcase');
      } else if (['ArrowUp', 'PageUp'].includes(event.key) && state.current === 'showcase-top') {
        event.preventDefault(); transition('hero');
      } else if (['ArrowDown', 'PageDown', ' '].includes(event.key) && state.current === 'showcase-top') {
        event.preventDefault();
        state.current = 'showcase-free';
        observer?.disable();
        runtime.lenis?.start();
        runtime.lenis?.scrollTo(window.scrollY + 120, { duration: 0.3 });
      }
    };
    window.addEventListener('studio:go-to-section', handleGoTo);
    document.addEventListener('click', handleAnchorClick, true);
    document.addEventListener('keydown', handleKeyDown);
    root.dataset.sectionSnap = 'ready';

    // Browser scroll restoration may happen just after hydration; re-evaluate
    // before accepting the first user gesture so a mid-Showcase reload is free.
    const restoreFrame = requestAnimationFrame(() => {
      if (state.current !== 'transitioning') establishInitialState();
      ScrollTrigger.refresh();
    });

    return () => {
      failed = true;
      cancelAnimationFrame(restoreFrame);
      window.clearTimeout(safetyTimer);
      window.clearTimeout(refreshTimer);
      timeline?.kill();
      observer?.kill();
      boundary?.kill();
      unsubscribeLenis();
      window.removeEventListener('load', onLoad);
      window.removeEventListener('studio:go-to-section', handleGoTo);
      document.removeEventListener('click', handleAnchorClick, true);
      document.removeEventListener('keydown', handleKeyDown);
      delete root.dataset.sectionSnap;
      root.style.scrollBehavior = originalScrollBehavior;
      cleanTransitionStyles();
      if (state.current === 'hero' || state.current === 'showcase-top') runtime.lenis?.start();
    };
  }, [sections.hero, sections.showcase, onEnter, onLeave]);
}
