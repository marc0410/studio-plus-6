'use client';
import { usePanelTimeline } from './usePanelTimeline';
import { getShowcaseStagePrevious, getShowcaseStageStart } from '@/data/design-tokens';
export function useMomentsStage() { return usePanelTimeline('moments', getShowcaseStageStart('moments'), getShowcaseStagePrevious('moments')); }
