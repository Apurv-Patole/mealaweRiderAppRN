import { ONBOARDING_COLORS } from '@/features/onboarding/onboardingTheme';
import type { ColorSet } from '@/theme/colorSet';

/**
 * Colours and sizes for the redesigned registration screens (Figma "Dev common", node 2003:2192).
 * Shares the emerald green with onboarding, login and home. Scoped here until the app is re-themed,
 * then promote into `src/global.css`. `REGISTER_COLORS_DARK` is the dark twin; read them with `useRegisterColors()`.
 */
export const REGISTER_COLORS = {
  canvas: ONBOARDING_COLORS.canvas,
  card: ONBOARDING_COLORS.sheet,
  green: ONBOARDING_COLORS.green,
  greenInk: ONBOARDING_COLORS.greenInk,
  onGreen: ONBOARDING_COLORS.onGreen,
  /** Deep green used for links, selected chips and the progress label. */
  greenDeep: '#006442',
  ink: '#181d1a',
  /** Secondary copy under headings and in the footer link. */
  body: '#3e4942',
  muted: ONBOARDING_COLORS.muted,
  placeholder: '#a7b0a9',
  border: '#e7ece7',
  fieldBorder: '#d6ddd7',
  required: '#c43d3d',
  tile: '#ebefea',
  trustBg: 'rgba(165,239,202,0.3)',
  progressOff: '#e7ece7',
  /** Tint over the current progress segment (after step 1). */
  lime: '#b9f62c',
  requiredTagBg: '#cdffe1',
  mintBannerBg: '#e6f2ee',
  mintBannerBorder: 'rgba(165,239,202,0.6)',
  mintBannerInk: '#005138',
  switchOff: '#d6ddd7',
  tagGrey: '#e5e9e4',
  /** Passed-check text. */
  success: '#16834a',
  /** "SPEED" pill and the Verify UPI button. */
  limeBright: '#b8f52b',
  limePill: '#b9f62c',
  limePillInk: '#141f00',
  upiTile: '#e6f2ee',
  /** Dashed outline of an empty photo slot. */
  slotBorder: '#d6ddd7',
  photoOverlay: 'rgba(52,59,54,0.2)',
} as const;

export type RegisterColors = typeof REGISTER_COLORS;

export const REGISTER_COLORS_DARK: ColorSet<RegisterColors> = {
  canvas: '#0e1411',
  card: '#161d19',
  green: '#037f56',
  greenInk: '#34c895',
  onGreen: '#ffffff',
  greenDeep: '#4fd1a1',
  ink: '#eef3ef',
  body: '#c3cdc6',
  muted: '#a3aea6',
  placeholder: '#7d8a81',
  border: '#26312b',
  fieldBorder: '#35423a',
  required: '#f08a8a',
  tile: '#1f2823',
  trustBg: 'rgba(52,200,149,0.14)',
  progressOff: '#26312b',
  lime: '#b9f62c',
  requiredTagBg: '#1f4033',
  mintBannerBg: '#1b2e25',
  mintBannerBorder: 'rgba(52,200,149,0.25)',
  mintBannerInk: '#b6ecd5',
  switchOff: '#35423a',
  tagGrey: '#2a332e',
  success: '#5fd39a',
  limeBright: '#b8f52b',
  limePill: '#b9f62c',
  limePillInk: '#141f00',
  upiTile: '#1b2e25',
  slotBorder: '#35423a',
  photoOverlay: 'rgba(52,59,54,0.2)',
};

export const REGISTER_METRICS = {
  backSize: 44,
  fieldHeight: 48,
  fieldRadius: 8,
  cardRadius: 16,
  cardPadding: 17,
  tileSize: 32,
  bloodChipHeight: 44,
  bloodColumns: 4,
  gap: 16,
  buttonHeight: 48,
  buttonRadius: 12,
} as const;
