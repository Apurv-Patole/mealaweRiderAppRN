import { useSchemePalette } from '@/theme/useSchemePalette';

import { ONBOARDING_COLORS, ONBOARDING_COLORS_DARK, type OnboardingColors } from './onboardingTheme';

/** Onboarding colours for the current light or dark scheme. */
export function useOnboardingColors(): OnboardingColors {
  return useSchemePalette<OnboardingColors>(ONBOARDING_COLORS, ONBOARDING_COLORS_DARK as OnboardingColors);
}
