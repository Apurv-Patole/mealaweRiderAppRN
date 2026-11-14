import { useCallback, useEffect, useMemo, useState } from 'react';

import type { RiderProfile } from '@/features/auth';
import type { LatLng } from '@/lib/geo';

import { summariseKitchens, type KitchenSummary } from './kitchen';
import { fetchSlotOrders } from './shiftApi';

interface Loaded {
  key: string;
  orders: unknown[];
}

interface UseSlotKitchenArgs {
  enabled: boolean;
  rider: RiderProfile | null;
  mealSlot: string | null;
  riderLocation: LatLng | null;
}

interface UseSlotKitchen {
  loading: boolean;
  failed: boolean;
  summary: KitchenSummary;
  reload: () => void;
}

/**
 * Loads today's orders for the rider's route and slot and works out which kitchen to visit
 * first (nearest to the rider). Used to check the 100 m attendance gate before a shift starts.
 */
export function useSlotKitchen({ enabled, rider, mealSlot, riderLocation }: UseSlotKitchenArgs): UseSlotKitchen {
  const [reloadCount, setReloadCount] = useState(0);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failedKey, setFailedKey] = useState<string | null>(null);

  const routeNo = rider?.routeNo ?? '';
  const clusterIds = useMemo(
    () => (rider?.clusters ?? []).map((cluster) => cluster.clusterId).filter((id): id is string => !!id),
    [rider?.clusters],
  );
  const canLoad = enabled && !!rider && !!routeNo && !!mealSlot;
  const key = `${rider?.riderId ?? ''}|${routeNo}|${mealSlot ?? ''}|${clusterIds.join(',')}|${reloadCount}`;

  useEffect(() => {
    if (!canLoad || !mealSlot) return;
    let cancelled = false;
    fetchSlotOrders({ routeNo, mealType: mealSlot, clusterIds })
      .then((orders) => {
        if (!cancelled) setLoaded({ key, orders });
      })
      .catch(() => {
        if (!cancelled) setFailedKey(key);
      });
    return () => {
      cancelled = true;
    };
  }, [canLoad, key, routeNo, mealSlot, clusterIds]);

  const summary = useMemo(
    () => summariseKitchens(loaded?.key === key ? loaded.orders : [], riderLocation),
    [loaded, key, riderLocation],
  );
  const failed = failedKey === key;
  const loading = canLoad && loaded?.key !== key && !failed;

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return { loading, failed, summary, reload };
}
