import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { isDemoSession } from '@/features/demo/demoSession';
import { useSimulatorStore } from '@/features/demo/demoSimulator';
import { toLatLng, type LatLng } from '@/lib/geo';

export interface CurrentLocation {
  location: LatLng | null;
  /** True when location permission is missing, so the screen can ask for it. */
  denied: boolean;
}

/** Position updates are requested at most this often, and only after moving this far. */
const UPDATE_INTERVAL_MS = 5_000;
const UPDATE_DISTANCE_M = 5;

/**
 * Live position while `enabled` (the Route tab uses it to show distance to the kitchen).
 * The watch stops when disabled or unmounted, so it never drains the battery in the background.
 */
export function useCurrentLocation(enabled: boolean): CurrentLocation {
  const [state, setState] = useState<CurrentLocation>({ location: null, denied: false });
  const demo = isDemoSession();
  const simulated = useSimulatorStore((store) => store.position);

  useEffect(() => {
    if (!enabled || demo) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    void (async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (cancelled) return;
      if (!permission.granted) {
        setState({ location: null, denied: true });
        return;
      }
      const watch = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: UPDATE_INTERVAL_MS,
          distanceInterval: UPDATE_DISTANCE_M,
        },
        (position) => {
          const point = toLatLng({ lat: position.coords.latitude, lng: position.coords.longitude });
          if (point) setState({ location: point, denied: false });
        },
      );
      if (cancelled) watch.remove();
      else subscription = watch;
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, demo]);

  if (demo) return { location: enabled ? simulated : null, denied: false };
  return state;
}
