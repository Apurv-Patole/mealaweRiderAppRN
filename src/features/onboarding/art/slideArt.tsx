import type { ComponentType } from 'react';

import type { SlideIcon } from '../slides';
import { MapBackdrop } from './MapBackdrop';
import { ProofBackdrop, ProofHero } from './ProofArt';
import { EarningsBackdrop, EarningsHero } from './EarningsArt';
import { ShiftHero } from './SlideHeroes';
import type { OnboardingColors } from '../onboardingTheme';

export interface SlideArt {
  /** Which palette colour sits behind the map, so extra height on tall screens blends in. */
  background: keyof Pick<OnboardingColors, 'mint' | 'mapPale' | 'earningsBg'>;
  Backdrop: ComponentType;
  Hero: ComponentType;
}

/** Per-slide map and hero art, from the Figma onboarding frames. */
export const SLIDE_ART: Record<SlideIcon, SlideArt> = {
  shift: { background: 'mint', Backdrop: MapBackdrop, Hero: ShiftHero },
  proof: { background: 'mapPale', Backdrop: ProofBackdrop, Hero: ProofHero },
  earnings: { background: 'earningsBg', Backdrop: EarningsBackdrop, Hero: EarningsHero },
};

