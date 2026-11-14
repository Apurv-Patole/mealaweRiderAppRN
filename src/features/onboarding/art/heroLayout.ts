/**
 * Geometry of the onboarding hero, taken from the Figma frame (390 x 844, node 2003:3).
 * Everything is in design points; `heroScale` fits the frame to the real screen.
 * Pure (no React Native imports) so it can be unit tested.
 */
export const FRAME = { width: 390, height: 844 } as const;

/** The bottom sheet is 324 pt tall in the design, so the hero is the 520 pt above it. */
export const SHEET_HEIGHT = 324;
export const HERO_HEIGHT = FRAME.height - SHEET_HEIGHT;

/** Below this the dial would overlap the sheet on very short screens, so we stop shrinking and accept clipping. */
const MIN_SCALE = 0.78;

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Fit scale for the hero: limited by screen width and by the room left above the sheet. */
export function heroScale(screenWidth: number, heroHeight: number): number {
  const fit = Math.min(screenWidth / FRAME.width, heroHeight / HERO_HEIGHT);
  return Math.min(1, Math.max(MIN_SCALE, fit));
}

/** Horizontal offset that centres the scaled 390 pt frame on a wider (or narrower) screen. */
export function heroOffsetX(screenWidth: number, scale: number): number {
  return (screenWidth - FRAME.width * scale) / 2;
}

/** Where each map asset sits in the frame. Sizes are the SVGs' own sizes, positions from the Figma insets. */
export const MAP_PLACEMENT = {
  halo: { left: 3, top: 75, width: 385, height: 394 },
  roadA: { left: -25.88, top: 131.96, width: 438.898, height: 67.5322 },
  roadB: { left: -18.11, top: 259.63, width: 421.397, height: 61.5153 },
  roadC: { left: 105.42, top: -9.68, width: 58.2797, height: 369.588 },
  roadD: { left: 260.81, top: -37.1, width: 35.9613, height: 362.381 },
  roadE: { left: -17, top: 373.16, width: 429.321, height: 23.7682 },
  dottedPath: { left: 1.44, top: 479.47, width: 321.476, height: 14.824 },
} as const satisfies Record<string, Rect>;

/** Shift dial (slide 1) and its companions. */
export const DIAL = {
  size: 268,
  /** Left edge: the dial is centred on the frame, nudged 10 pt right. */
  left: 71,
  top: 174,
  ring: 26,
  face: 268 - 26 * 2,
} as const;

export const AVATAR_CARD = { left: 16, top: 236.26, size: 96 } as const;
export const PILL_ON_TIME = { left: 16, top: 135 } as const;
/** The bonus pill floats 18 pt above the sheet's top edge (frame y 502 to 520). */
export const PILL_BONUS = { right: 15.64, gapAboveSheet: 18 } as const;

export const LOGO = { width: 98, height: 36 } as const;

/** Slide 2 ("Pickup and deliver with proof", Figma node 2003:95): map layers, positions from the Figma insets. */
export const PROOF_MAP = {
  roadA: { left: 295, top: 0, width: 95, height: 220 },
  roadB: { left: 0, top: 316.33, width: 390, height: 203.634 },
  roadC: { left: 0, top: 448.67, width: 390, height: 111.346 },
  roadD: { left: 111.99, top: -13, width: 66.0013, height: 546.001 },
  roadE: { left: -32, top: 83.03, width: 454.002, height: 64.0016 },
  roadF: { left: -32, top: 288.04, width: 454.006, height: 129.006 },
  roadG: { left: 249.02, top: -11.02, width: 52.0006, height: 542.001 },
  route: { left: 82.72, top: 157.76, width: 239.5, height: 294.5 },
} as const satisfies Record<string, Rect>;

export const PROOF_PHOTO = { left: 32, top: 138, width: 168, height: 126, radius: 22 } as const;
export const PROOF_BADGE_GAP = 8;
export const PROOF_PICKUP = { left: 34, top: 418, size: 44 } as const;
export const PROOF_PIN = { left: 281, top: 138, width: 44, height: 56 } as const;
/** The pin's inner white dot (16 pt) sits 14 pt in from the pin's top-left. */
export const PROOF_PIN_DOT = { offset: 14, size: 16 } as const;
export const PROOF_RIDER = { left: 260, top: 273, halo: 36, core: 28 } as const;
/** "Live for the customer" floats 38 pt above the sheet (frame y 482 to 520). */
export const PROOF_LIVE = { right: 24, gapAboveSheet: 38 } as const;

/** Slide 3 ("Track every rupee you earn", Figma node 2003:194): concentric rings, wallet card, coins and tags. */
export const EARNINGS_RINGS = {
  inner: { left: 107, top: 195, width: 177, height: 177 },
  middle: { left: 71, top: 159, width: 249, height: 249 },
  outer: { left: 40, top: 128, width: 311, height: 311 },
} as const satisfies Record<string, Rect>;

export const EARNINGS_CARD = { left: 57.5, top: 209, width: 275, radius: 24, chartHeight: 112 } as const;
/** Bar heights in the wallet chart; the last (peak) bar is lime. */
export const EARNINGS_BARS = [34, 52, 42, 64, 58, 88] as const;
export const EARNINGS_BAR = { width: 22, radius: 8 } as const;
export const COIN = { size: 44 } as const;
export const COIN_UPPER = { left: 56, top: 145 } as const;
/** Lower coin and "+310" tag float above the sheet: frame y 476 and 488 against the sheet at 520. */
export const COIN_LOWER = { right: 50, gapAboveSheet: 44 } as const;
export const TAG_UPPER = { right: 41, top: 148 } as const;
export const TAG_LOWER = { left: 16, gapAboveSheet: 32 } as const;
export const CAPSULE = { left: 195, top: 473 } as const;
