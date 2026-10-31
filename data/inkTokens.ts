/** Handwriting system values. Keep these in sync with app/ink.css. */
export const INK_ENABLED = true;
export const inkTokens = {
  width: 2.5,
  mobileWidth: 1.5,
  circleDuration: 0.8,
  lineDuration: 0.5,
  hoverDuration: 0.4,
  enterThreshold: 0.7,
  scrubStart: 'top 80%',
  scrubEnd: 'top 40%',
  jitter: 2.2,
  overshoot: 0.08,
  defaultColor: 'var(--ink)',
  accentColor: 'var(--ink-accent)',
  orangeColor: 'var(--orange)',
} as const;
export type InkColor = 'ink' | 'accent' | 'orange';
export type InkType = 'circle' | 'underline' | 'wave' | 'double' | 'heart' | 'star' | 'check' | 'arrow' | 'spark' | 'loop';
export type InkTrigger = 'enter' | 'scrub' | 'hover' | 'focus' | 'manual';
