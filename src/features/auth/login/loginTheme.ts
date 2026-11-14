import { ONBOARDING_COLORS } from '@/features/onboarding/onboardingTheme';
import type { ColorSet } from '@/theme/colorSet';

/**
 * Colours and sizes for the redesigned login (Figma "Dev common", node 2003:432). It shares the emerald
 * green with onboarding and adds the dark hero and red error from the design. Scoped here until the app is
 * re-themed, then promote into `src/global.css`. `LOGIN_COLORS_DARK` is the dark twin; the hero is dark in both.
 * Read them with `useLoginColors()`.
 */
export const LOGIN_COLORS = {
  canvas: ONBOARDING_COLORS.canvas,
  surface: ONBOARDING_COLORS.sheet,
  green: ONBOARDING_COLORS.green,
  greenInk: ONBOARDING_COLORS.greenInk,
  onGreen: ONBOARDING_COLORS.onGreen,
  ink: ONBOARDING_COLORS.ink,
  muted: ONBOARDING_COLORS.muted,
  /** Slightly darker body copy used by the code screen's subtitle. */
  body: '#4f5953',
  /** Idle input border. */
  border: ONBOARDING_COLORS.dotIdle,
  heroBg: '#0d2319',
  heroMuted: '#a7b0a9',
  onHero: '#ffffff',
  lime: '#b8f52b',
  /** Text on a lime fill: dark in both modes. */
  onLime: '#171c19',
  chipBg: '#e6f2ee',
  error: '#c43d3d',
  backBorder: '#e2e6e3',
  separator: '#d6d3d1',
} as const;

export type LoginColors = typeof LOGIN_COLORS;

export const LOGIN_COLORS_DARK: ColorSet<LoginColors> = {
  canvas: '#0e1411',
  surface: '#161d19',
  green: '#037f56',
  greenInk: '#34c895',
  onGreen: '#ffffff',
  ink: '#eef3ef',
  muted: '#a3aea6',
  body: '#b7c2ba',
  border: '#35423a',
  heroBg: '#0d2319',
  heroMuted: '#a7b0a9',
  onHero: '#ffffff',
  lime: '#b8f52b',
  onLime: '#171c19',
  chipBg: '#1b2e25',
  error: '#f08a8a',
  backBorder: '#e2e6e3',
  separator: '#3f4741',
};

export const LOGIN_METRICS = {
  heroBottomRadius: 24,
  fieldHeight: 52,
  buttonHeight: 50,
  demoButtonHeight: 52,
  radius: 12,
  otpBoxHeight: 60,
  otpGap: 8,
  /** The design's back button is 24 pt; hitSlop grows it to a 48 pt target. */
  backSize: 24,
  backHitSlop: 12,
} as const;
