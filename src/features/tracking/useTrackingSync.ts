import { useEffect } from 'react';

import { isDemoToken } from '@/features/demo/demoSession';
import { useShiftStore } from '@/features/shift/shiftStore';
import { isShiftOnline } from '@/features/shift/shiftModel';
import { usePermissions } from '@/features/permissions/usePermissions';
import { rideStarted } from '@/features/route/routePlanner';
import { useRideStore } from '@/features/trip/rideStore';
import { useEffectiveOrders } from '@/features/trip/useEffectiveOrders';
import { useAuthStore } from '@/store';

import type { TrackingStage } from './trackingCore';
import { startTracking, stopTracking } from './trackingControl';
import { useTrackingStatusStore } from './trackingStatusStore';

const NEEDS_ALWAYS_LOCATION = 'Allow location "all the time" so customers can follow your delivery.';

function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'Could not start location sharing.';
}

/**
 * Runs location sharing for exactly as long as the rider is online (mounted once, in the tabs layout):
 * it starts when a shift is online and "Allow all the time" is granted, switches to the faster rate when the
 * delivery ride starts, and stops when the shift ends (by the rider or automatically). A failed refresh of
 * the shift never stops it, so a dropped connection does not interrupt tracking.
 */
export function useTrackingSync(): void {
  const riderId = useAuthStore((state) => state.rider?.riderId);
  const demo = useAuthStore((state) => isDemoToken(state.token));
  const shift = useShiftStore((state) => state.shift);
  const shiftLoading = useShiftStore((state) => state.loading);
  const savedRideShift = useRideStore((state) => state.startedShiftId);
  const orders = useEffectiveOrders();
  const permissions = usePermissions();
  const setError = useTrackingStatusStore((state) => state.setError);

  const online = isShiftOnline(shift);
  const shiftId = shift?.id;
  const allowed =
    permissions.statuses.location === 'granted' && permissions.statuses.backgroundLocation === 'granted';
  const stage: TrackingStage =
    online && (shift.stage === 'delivery_stage' || rideStarted(orders, savedRideShift, shift.id))
      ? 'delivery_stage'
      : 'pickup_stage';

  useEffect(() => {
    // Wait until we know the shift and the permissions, so a restart does not briefly stop a running service.
    // Demo mode has no real GPS to share (the simulator moves the rider instead).
    if (demo || shiftLoading || permissions.loading) return;

    if (online && riderId && shiftId) {
      if (!allowed) {
        setError(NEEDS_ALWAYS_LOCATION);
        return;
      }
      startTracking({ riderId, shiftId, stage })
        .then(() => setError(null))
        .catch((error: unknown) => setError(messageFor(error)));
      return;
    }

    setError(null);
    stopTracking().catch((error: unknown) => setError(messageFor(error)));
  }, [demo, online, allowed, riderId, shiftId, stage, shiftLoading, permissions.loading, setError]);
}
