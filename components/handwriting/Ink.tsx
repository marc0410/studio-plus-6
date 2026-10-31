'use client';

import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { handDrawnPaths } from '@/lib/handDrawn';
import { INK_ENABLED, inkTokens, type InkColor, type InkTrigger, type InkType } from '@/data/inkTokens';
import { useInkContext } from './InkProvider';

gsap.registerPlugin(ScrollTrigger);

export type InkProps = {
  children: ReactNode;
  type?: InkType;
  color?: InkColor;
  trigger?: InkTrigger;
  delay?: number;
  duration?: number;
  seed?: number;
  label?: string;
  replayKey?: string | number;
  className?: string;
};

export function Ink({ children, type = 'circle', color = 'ink', trigger = 'enter', delay = 0, duration, seed = 1, label, replayKey, className = '' }: InkProps) {
  const root = useRef<HTMLSpanElement>(null);
  const { reducedMotion, mobile } = useInkContext();
  const paths = handDrawnPaths(type, seed);

  useEffect(() => {
    const element = root.current;
    if (!element || !INK_ENABLED || reducedMotion || trigger !== 'scrub') return;
    element.dataset.inkRuntime = 'true';
    const svgPaths = gsap.utils.toArray<SVGPathElement>('.ink__path', element);
    const tween = gsap.fromTo(svgPaths, { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: element, start: inkTokens.scrubStart, end: inkTokens.scrubEnd, scrub: .6, invalidateOnRefresh: true } });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, [trigger, reducedMotion]);

  useEffect(() => {
    const element = root.current;
    if (!element || !INK_ENABLED || reducedMotion || !['hover', 'focus', 'manual'].includes(trigger)) return;
    element.dataset.inkRuntime = 'true';
    gsap.set(gsap.utils.toArray<SVGPathElement>('.ink__path', element), { strokeDashoffset: 1, opacity: 0 });
  }, [trigger, reducedMotion]);

  useEffect(() => {
    const element = root.current;
    if (!element || !INK_ENABLED || reducedMotion || trigger !== 'manual' || replayKey === undefined) return;
    element.dataset.inkRuntime = 'true';
    const svgPaths = gsap.utils.toArray<SVGPathElement>('.ink__path', element);
    gsap.fromTo(svgPaths, { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: duration ?? inkTokens.circleDuration, delay, stagger: .12, ease: 'power2.inOut', overwrite: true });
  }, [replayKey, trigger, reducedMotion, delay, duration]);

  const style = {
    '--ink-color': color === 'accent' ? 'var(--ink-accent)' : color === 'orange' ? 'var(--orange)' : 'var(--ink)',
    '--ink-stroke-width': mobile ? `${inkTokens.mobileWidth}px` : `${inkTokens.width}px`,
    '--ink-delay': `${delay}s`,
  } as CSSProperties;
  return <span ref={root} className={`ink ink--${type} ink--${trigger} ${className}`.trim()} style={style} data-ink-trigger={trigger} data-ink-delay={delay} data-ink-duration={duration ?? (type === 'circle' ? inkTokens.circleDuration : inkTokens.lineDuration)} data-ink-type={type}>
    <span className="ink__content">{children}</span>
    <svg className="ink__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {paths.map((d, index) => <path key={`${seed}-${index}`} className="ink__path" d={d} pathLength="1" strokeDasharray="1" strokeDashoffset="0" data-ink-head={type === 'arrow' && index > 0 ? 'true' : undefined} data-ink-linear={type === 'underline' || type === 'wave' || type === 'double' ? 'true' : undefined} />)}
    </svg>
    {label && <span className="ink__label" aria-hidden="true">{label}</span>}
  </span>;
}

export function HandCircle(props: Omit<InkProps, 'type'>) { return <Ink {...props} type="circle" />; }
export function HandUnderline({ variant = 'wave', ...props }: Omit<InkProps, 'type'> & { variant?: 'straight' | 'wave' | 'double' }) {
  return <Ink {...props} type={variant === 'straight' ? 'underline' : variant} />;
}
export function HandScribble({ variant = 'spark', ...props }: Omit<InkProps, 'type'> & { variant?: 'heart' | 'star' | 'spark' | 'check' | 'loop' }) {
  return <Ink {...props} type={variant} />;
}

export function HandLabel({ text, color = 'ink', trigger = 'enter', delay = 0, seed = 1, className = '' }: { text: string; color?: InkColor; trigger?: InkTrigger; delay?: number; seed?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reducedMotion } = useInkContext();
  const colorValue = color === 'accent' ? 'var(--ink-accent)' : color === 'orange' ? 'var(--orange)' : 'var(--ink)';
  useEffect(() => {
    const element = ref.current;
    const word = element?.querySelector<HTMLElement>('.ink__word-text');
    if (!element || !word || reducedMotion || trigger !== 'scrub') return;
    element.dataset.inkRuntime = 'true';
    const animation = gsap.fromTo(word, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: element, start: inkTokens.scrubStart, end: inkTokens.scrubEnd, scrub: .6 } });
    return () => { animation.scrollTrigger?.kill(); animation.kill(); };
  }, [reducedMotion, trigger]);
  useEffect(() => {
    const element = ref.current;
    const word = element?.querySelector<HTMLElement>('.ink__word-text');
    if (!element || !word || reducedMotion || trigger !== 'manual') return;
    element.dataset.inkRuntime = 'true';
    gsap.set(word, { clipPath: 'inset(0 100% 0 0)', opacity: .35 });
    gsap.to(word, { clipPath: 'inset(0 0% 0 0)', opacity: 1, duration: .65, delay, ease: 'power2.out' });
  }, [delay, reducedMotion, trigger, seed]);
  return <span ref={ref} className={`ink-word ink-word--${trigger} ${className}`.trim()} style={{ '--ink-color': colorValue, '--ink-delay': `${delay}s` } as CSSProperties} data-ink-trigger={trigger} data-ink-delay={delay} data-ink-seed={seed}>
    <span className="ink__word-text" aria-hidden="true">{text}</span>
  </span>;
}

export function Surface({ tone, as: Tag = 'div', children, className = '' }: { tone: 'dark' | 'light' | 'blue' | 'red'; as?: 'div' | 'section' | 'footer'; children: ReactNode; className?: string }) {
  return <Tag className={className} data-surface={tone}>{children}</Tag>;
}

export function useInk<T extends HTMLElement>(ref: RefObject<T | null>, options: { duration?: number } = {}) {
  const { reducedMotion } = useInkContext();
  return { replay: () => {
    const element = ref.current;
    if (!element || reducedMotion || !INK_ENABLED) return;
    const paths = gsap.utils.toArray<SVGPathElement>('.ink__path', element);
    gsap.fromTo(paths, { strokeDashoffset: 1, opacity: 0 }, { strokeDashoffset: 0, opacity: 1, duration: options.duration ?? inkTokens.hoverDuration, ease: 'power2.inOut', stagger: .12, overwrite: true });
  } };
}
