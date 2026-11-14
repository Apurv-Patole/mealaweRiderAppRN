import { ROUTING } from '@/config/constants';
import type { LatLng } from '@/lib/geo';
import { decodePolyline } from '@/lib/polyline';

/** A road route from one point to another. The time is for normal driving: the free service has no live traffic. */
export interface LegRoute {
  points: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
}

interface OsrmResponse {
  code?: string;
  routes?: { geometry?: string; distance?: number; duration?: number }[];
}

/**
 * Asks OSRM (free, no key) for the driving route. Returns null when there is no road route.
 * Throws on network errors so callers can keep showing the last route. This calls a third-party server on
 * purpose WITHOUT the rider's login token, so it does not go through the app's HTTP client.
 */
export async function fetchLegRoute(from: LatLng, to: LatLng): Promise<LegRoute | null> {
  const coordinates = `${from.lng.toFixed(5)},${from.lat.toFixed(5)};${to.lng.toFixed(5)},${to.lat.toFixed(5)}`;
  const url = `${ROUTING.baseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=polyline`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROUTING.timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Routing service answered ${response.status}`);
    const body = (await response.json()) as OsrmResponse;
    const route = body.code === 'Ok' ? body.routes?.[0] : undefined;
    if (!route?.geometry) return null;
    const points = decodePolyline(route.geometry);
    if (points.length < 2) return null;
    return { points, distanceMeters: route.distance ?? 0, durationSeconds: route.duration ?? 0 };
  } finally {
    clearTimeout(timer);
  }
}
