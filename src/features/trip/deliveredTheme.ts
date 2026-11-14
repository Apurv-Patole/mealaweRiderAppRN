/** Colours of the "Delivered" hero badge (mint rings, lime dot, green core), light and dark. */
export interface DeliveredBadgeColors {
  corners: string;
  ringOuter: string;
  ringInner: string;
  dot: string;
  core: string;
}

export const DELIVERED_BADGE: DeliveredBadgeColors = {
  corners: 'rgba(167,243,208,0.5)',
  ringOuter: 'rgba(209,250,229,0.6)',
  ringInner: 'rgba(167,243,208,0.4)',
  dot: '#b8f52b',
  core: '#037f56',
};

export const DELIVERED_BADGE_DARK: DeliveredBadgeColors = {
  corners: 'rgba(52,200,149,0.35)',
  ringOuter: 'rgba(52,200,149,0.16)',
  ringInner: 'rgba(52,200,149,0.26)',
  dot: '#b8f52b',
  core: '#037f56',
};
