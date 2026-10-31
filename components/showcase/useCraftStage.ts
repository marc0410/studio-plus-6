'use client';
import { usePanelTimeline } from './usePanelTimeline';
import { getShowcaseStagePrevious, getShowcaseStageStart } from '@/data/design-tokens';
export function useCraftStage() { return usePanelTimeline('craft', getShowcaseStageStart('craft'), getShowcaseStagePrevious('craft')); }
