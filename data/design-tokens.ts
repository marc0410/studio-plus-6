/** Shared Studio+ brand tokens and motion settings for the Showcase scene. */
export const designTokens = {
  colors: {
    black: '#020202', blackSoft: '#0b0b0c', graphite: '#17181b',
    red: '#eb0606', white: '#ffffff', blue: '#034da5', orange: '#fa8801',
    glass: 'rgba(255,255,255,.06)', glassBorder: 'rgba(255,255,255,.16)',
    redGlow: 'rgba(235,6,6,.35)', wood: '#21150f', paper: '#ffffff', ink: '#ffffff', label: '#0b0b0c', accent: '#eb0606',
  },
  motion: {
    // The Showcase currently has three active stops. Keep enough room for each
    // transition without making the pinned section feel endless.
    pinDistance: '+=1000%',
    mobilePinDistance: '+=620%',
    cameraZoom: 1.5,
    parallax: 3,
    cardStagger: 0.05,
    finalCutShade: 0.72,
  },
  layout: {
    stageCount: 3,
    desktopObjects: 12,
    mobileObjects: 8,
  },
} as const;

export const showcaseTokens = designTokens;

export type ShowcaseStage = 'search' | 'studio' | 'craft' | 'moments' | 'finalcut';

export const showcaseStagePlan: Array<{ id: ShowcaseStage; label: string; duration: number }> = [
  { id: 'search', label: 'Recherche', duration: 2.35 },
  { id: 'studio', label: 'Studio', duration: 1 },
  { id: 'craft', label: 'Savoir-faire', duration: 1 },
  { id: 'moments', label: 'Instants', duration: 1.4 },
  { id: 'finalcut', label: 'Final Cut', duration: Number.POSITIVE_INFINITY },
];


/** Temporarily hidden from the Showcase navigation; their panels remain in the source for later reuse. */
export const pausedShowcaseStages: ShowcaseStage[] = ['studio', 'craft', 'moments'];

export function getVisibleShowcaseStages() {
  return showcaseStagePlan.filter(({ id }) => !pausedShowcaseStages.includes(id));
}

export function getShowcaseStageStart(stage: ShowcaseStage) {
  let position = 0;
  for (const item of showcaseStagePlan) {
    if (item.id === stage) return position;
    if (!pausedShowcaseStages.includes(item.id)) position += item.duration;
  }
  return position;
}

export function getShowcaseStagePrevious(stage: ShowcaseStage): ShowcaseStage | undefined {
  const visible = getVisibleShowcaseStages();
  return visible[Math.max(0, visible.findIndex(({ id }) => id === stage) - 1)]?.id;
}

export const showcaseStageNames = getVisibleShowcaseStages().map(({ id, label }) => ({ id, label }));
