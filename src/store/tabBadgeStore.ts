import { create } from 'zustand';

/**
 * Tab-bar badge counts. The Orders count is filled by the rider's changes poll
 * (stage 3 and later); it is kept here so the tab bar never knows about orders.
 */
interface TabBadgeState {
  ordersCount: number;
  setOrdersCount: (count: number) => void;
}

export const useTabBadgeStore = create<TabBadgeState>((set) => ({
  ordersCount: 0,
  setOrdersCount: (count) => set({ ordersCount: Math.max(0, Math.floor(count)) }),
}));

const MAX_BADGE = 99;

/** Badge text for a count: nothing at zero, "99+" above the cap. */
export function badgeText(count: number): string {
  if (count <= 0) return '';
  return count > MAX_BADGE ? `${MAX_BADGE}+` : String(count);
}
