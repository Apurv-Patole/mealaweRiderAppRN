import { useSchemePalette } from '@/theme/useSchemePalette';

import {
  DETAIL_COLORS,
  DETAIL_COLORS_DARK,
  HOME_COLORS,
  HOME_COLORS_DARK,
  ORDER_PILL,
  ORDER_PILL_DARK,
  type DetailColors,
  type HomeColors,
  type OrderPillColors,
} from './homeTheme';

/** Home and order-list colours for the current light or dark scheme. */
export function useHomeColors(): HomeColors {
  return useSchemePalette<HomeColors>(HOME_COLORS, HOME_COLORS_DARK as HomeColors);
}

/** Order detail colours for the current light or dark scheme. */
export function useDetailColors(): DetailColors {
  return useSchemePalette<DetailColors>(DETAIL_COLORS, DETAIL_COLORS_DARK as DetailColors);
}

/** Status pill colours (by tone) for the current light or dark scheme. */
export function useOrderPill(): OrderPillColors {
  return useSchemePalette<OrderPillColors>(ORDER_PILL, ORDER_PILL_DARK as unknown as OrderPillColors);
}
