import type { ColorSet } from '@/theme/colorSet';

/**
 * Onboarding colours from the Figma "Dev common" file (Onboarding 1 to 3, nodes 2003:3, 2003:95, 2003:194).
 * `ONBOARDING_COLORS` is the light palette from the design and `ONBOARDING_COLORS_DARK` its dark twin: the same
 * green-tinted look on near-black surfaces. Read them with `useOnboardingColors()`.
 */
export const ONBOARDING_COLORS = {
  /** Map hero background. */
  mint: '#d8efe4',
  /** Page canvas behind the map. */
  canvas: '#f5f7f3',
  sheet: '#ffffff',
  green: '#037f56',
  /** Brand green for text and thin lines: the same green on light, a lighter one on dark surfaces. */
  greenInk: '#037f56',
  greenDeep: '#004d34',
  lime: '#a7f20d',
  ink: '#171c19',
  muted: '#68716b',
  dotIdle: '#d6ddd7',
  onGreen: '#ffffff',
  /** Slide 2 map: a flat pale grey-green instead of mint. */
  mapPale: '#edf4f0',
  /** Slide 3 background: a flat soft green. */
  earningsBg: '#e1efe7',
  /** Slide 2 live-rider halo and the "Proof saved" badge. */
  limeHalo: '#b8f52b',
  proofBadge: '#e7f6ee',
  liveBadgeGlass: 'rgba(255,255,255,0.95)',
  liveBadgeBorder: '#f3f4f6',
  /** Floating pills sit on the map as frosted glass. */
  pillGlass: 'rgba(255,255,255,0.72)',
  pillBorder: 'rgba(255,255,255,0.8)',
  /** Dial ticks: the brand green at 80% so they read as engraved, not drawn. */
  tick: 'rgba(3,127,86,0.8)',
} as const;

export type OnboardingColors = typeof ONBOARDING_COLORS;

export const ONBOARDING_COLORS_DARK: ColorSet<OnboardingColors> = {
  mint: '#123024',
  canvas: '#0e1411',
  sheet: '#161d19',
  green: '#037f56',
  greenInk: '#34c895',
  greenDeep: '#bdf0da',
  lime: '#a7f20d',
  ink: '#eef3ef',
  muted: '#a3aea6',
  dotIdle: '#35423a',
  onGreen: '#ffffff',
  mapPale: '#111a15',
  earningsBg: '#12251b',
  limeHalo: '#b8f52b',
  proofBadge: '#1c3226',
  liveBadgeGlass: 'rgba(22,29,25,0.95)',
  liveBadgeBorder: '#26302a',
  pillGlass: 'rgba(22,29,25,0.72)',
  pillBorder: 'rgba(255,255,255,0.12)',
  tick: 'rgba(52,200,149,0.8)',
};
