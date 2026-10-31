'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const textInputTypes = new Set(['text', 'email', 'number', 'password', 'search', 'tel', 'url', 'date', 'datetime-local', 'time']);

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const moveX = gsap.quickTo(cursor, 'x', { duration: 0.16, ease: 'power3.out' });
    const moveY = gsap.quickTo(cursor, 'y', { duration: 0.16, ease: 'power3.out' });

    const syncPointer = () => {
      document.documentElement.classList.toggle('has-custom-cursor', pointerQuery.matches);
      if (!pointerQuery.matches) cursor.classList.remove('is-visible');
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerQuery.matches || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) return;

      if (reducedMotionQuery.matches) {
        gsap.set(cursor, { x: event.clientX, y: event.clientY });
      } else {
        moveX(event.clientX);
        moveY(event.clientY);
      }

      const target = event.target instanceof Element ? event.target : null;
      const input = target?.closest('input');
      const isText = Boolean(target?.closest('textarea,[contenteditable="true"]')) ||
        (input instanceof HTMLInputElement && textInputTypes.has(input.type));
      const isDrag = Boolean(target?.closest('.orbit-stage'));
      const isInteractive = Boolean(target?.closest('a,button,summary,select,label,[role="button"],[role="link"],input[type="checkbox"],input[type="radio"],input[type="range"]'));

      cursor.classList.toggle('is-text', isText);
      cursor.classList.toggle('is-drag', isDrag);
      cursor.classList.toggle('is-interactive', isInteractive && !isText && !isDrag);
      cursor.classList.add('is-visible');
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') cursor.classList.add('is-down');
    };
    const onPointerUp = () => cursor.classList.remove('is-down');
    const hide = () => cursor.classList.remove('is-visible', 'is-down');
    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) hide();
    };

    syncPointer();
    pointerQuery.addEventListener('change', syncPointer);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    window.addEventListener('pointerout', onPointerOut, { passive: true });
    window.addEventListener('blur', hide);

    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      pointerQuery.removeEventListener('change', syncPointer);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('pointerout', onPointerOut);
      window.removeEventListener('blur', hide);
      gsap.killTweensOf(cursor);
    };
  }, []);

  return <div className="site-cursor" ref={cursorRef} aria-hidden="true"><span>GLISSER</span></div>;
}
