import type Lenis from 'lenis';

let activeLenis: Lenis | null = null;
const listeners = new Set<(instance: Lenis | null) => void>();

/** Shared reference so the section snap and Showcase use the same Lenis instance. */
export function setScrollRuntime(instance: Lenis | null) {
  activeLenis = instance;
  listeners.forEach((listener) => listener(instance));
}

export function getScrollRuntime() {
  return activeLenis;
}

export function subscribeScrollRuntime(listener: (instance: Lenis | null) => void) {
  listeners.add(listener);
  listener(activeLenis);
  return () => listeners.delete(listener);
}
