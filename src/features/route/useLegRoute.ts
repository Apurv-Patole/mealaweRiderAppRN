import { useEffect, useRef, useState } from 'react';

import { haversineMeters, type LatLng } from '@/lib/geo';

import { fetchLegRoute, type LegRoute } from './directionsApi';

/** Ask Google for a new route only after the rider moved this far from where the last one started... */
const REROUTE_DISTANCE_M = 200;
/** ...and at least this long after the last request, so the Directions bill stays small. */
const MIN_REFRESH_MS = 90_000;
/** A new destination (the next stop changed) is fetched at once, but never faster than this. */
const MIN_GAP_MS = 5_000;

interface LegRouteState {
  route: LegRoute | null;
  loading: boolean;
}

/**
 * The road route from the rider to `destination`, with traffic. It is requested when the destination changes,
 * and again when the rider has clearly left the line (moved over 200 m and 90 s passed). The last good route
 * stays on screen if a refresh fails. Pass `enabled = false` to stop all requests (tab hidden, no shift).
 */
export function useLegRoute(origin: LatLng | null, destination: LatLng | null, enabled: boolean): LegRouteState {
  const [state, setState] = useState<LegRouteState>({ route: null, loading: false });
  const last = useRef<{ key: string; origin: LatLng; at: number } | null>(null);
  const inflight = useRef(false);
  const mounted = useRef(true);

  // Only leaving the screen drops a pending answer; a new GPS fix must not (it would discard every route).
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const destinationKey = destination ? `${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}` : '';

  useEffect(() => {
    if (!enabled || !origin || !destination) return;

    const previous = last.current;
    const now = Date.now();
    const destinationChanged = !previous || previous.key !== destinationKey;
    const sinceLast = previous ? now - previous.at : Infinity;
    const movedFar = previous ? haversineMeters(previous.origin, origin) > REROUTE_DISTANCE_M : true;

    const due = destinationChanged ? sinceLast >= MIN_GAP_MS : movedFar && sinceLast >= MIN_REFRESH_MS;
    if (!due || inflight.current) return;

    inflight.current = true;
    last.current = { key: destinationKey, origin, at: now };
    setState((current) => ({ route: destinationChanged ? null : current.route, loading: true }));

    fetchLegRoute(origin, destination)
      .then((route) => {
        if (mounted.current) setState({ route, loading: false });
      })
      .catch(() => {
        if (mounted.current) setState((current) => ({ route: current.route, loading: false }));
      })
      .finally(() => {
        inflight.current = false;
      });
  }, [enabled, origin, destination, destinationKey]);

  return state;
}
