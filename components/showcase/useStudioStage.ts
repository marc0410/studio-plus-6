'use client';
import { usePanelTimeline } from './usePanelTimeline';
import { getShowcaseStagePrevious, getShowcaseStageStart } from '@/data/design-tokens';
export function useStudioStage() { return usePanelTimeline('studio', getShowcaseStageStart('studio'), getShowcaseStagePrevious('studio')); }
