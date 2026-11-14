import type { ColorSet } from '@/theme/colorSet';

/**
 * Colours the Profile tab adds on top of the shared Home palette (Figma "Dev common", node 2038:2): the green
 * hero, the tinted icon tiles, the permission chips and the Light/Dark switch. `PROFILE_COLORS_DARK` is the dark
 * twin; read them with `useProfileColors()`.
 */
export const PROFILE_COLORS = {
  /** The hero gradient, top to bottom. */
  heroFrom: '#096d4c',
  heroMid: '#037f56',
  heroTo: '#026845',
  /** Icon tiles: a pale tint, its hairline and the icon colour. */
  editTileBg: '#ecfdf5',
  editTileBorder: 'rgba(209,250,229,0.6)',
  editTileIcon: '#037f56',
  walletTileBg: '#fffbeb',
  walletTileBorder: '#fef3c7',
  walletTileIcon: '#d97706',
  mintTileBg: '#ecfdf5',
  mintTileBorder: '#d1fae5',
  mintTileIcon: '#059669',
  blueTileBg: '#eff6ff',
  blueTileBorder: '#dbeafe',
  blueTileIcon: '#2563eb',
  chevron: '#a3a3a3',
  /** The permission chip that says "Allowed". */
  allowedBg: '#e8f6ed',
  allowedInk: '#16834a',
  /** The Light / Dark / System switch. */
  trackBg: '#eaefea',
  trackInk: '#68716b',
  thumbBg: '#ffffff',
  thumbInk: '#037f56',
  signOut: '#c43d3d',
  footer: '#a3a3a3',
} as const;

export type ProfileColors = typeof PROFILE_COLORS;

export const PROFILE_COLORS_DARK: ColorSet<ProfileColors> = {
  heroFrom: '#0e5a41',
  heroMid: '#0a6446',
  heroTo: '#08452f',
  editTileBg: '#16281f',
  editTileBorder: '#24402f',
  editTileIcon: '#34c895',
  walletTileBg: '#2e2610',
  walletTileBorder: '#4a3a14',
  walletTileIcon: '#f0c27a',
  mintTileBg: '#16281f',
  mintTileBorder: '#24402f',
  mintTileIcon: '#5fd39a',
  blueTileBg: '#17263a',
  blueTileBorder: '#223a57',
  blueTileIcon: '#8ab8f0',
  chevron: '#7d8a81',
  allowedBg: '#1c3226',
  allowedInk: '#5fd39a',
  trackBg: '#1c2520',
  trackInk: '#a3aea6',
  thumbBg: '#2a352f',
  thumbInk: '#34c895',
  signOut: '#f08a8a',
  footer: '#8a968e',
};

/** Colours fixed in both schemes: the pills on the green hero and the avatar ring. */
export const HERO_FIXED = {
  text: '#ffffff',
  phone: 'rgba(255,255,255,0.9)',
  avatarBg: 'rgba(7,92,64,0.8)',
  avatarBorder: 'rgba(255,255,255,0.9)',
  activePillBg: '#ffffff',
  activePillInk: '#171c19',
  activeDot: '#16834a',
  routePillBg: 'rgba(255,255,255,0.95)',
  routePillBorder: '#dbeafe',
  routePillInk: '#1d4ed8',
  routeDot: '#3b82f6',
  inactiveDot: '#a7b0a9',
  demoPillBg: 'rgba(0,0,0,0.25)',
  demoPillBorder: 'rgba(255,255,255,0.1)',
  demoLime: '#b8f52b',
  demoText: 'rgba(255,255,255,0.9)',
  demoSoft: 'rgba(255,255,255,0.7)',
} as const;
