/** Small geo helpers (pure, no React Native imports). */
export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;

// India, with a small buffer for border areas. Anything outside is treated as a bad geocode.
const INDIA = { minLat: 5, maxLat: 40, minLng: 65, maxLng: 100 } as const;

/** Great-circle distance between two points in metres (haversine). */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** True for a finite lat/lng inside India. Rejects (0, 0), the usual "missing geocode" value. */
export function isValidLatLng(point: unknown): point is LatLng {
  if (!point || typeof point !== 'object') return false;
  const { lat, lng } = point as Partial<LatLng>;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return lat >= INDIA.minLat && lat <= INDIA.maxLat && lng >= INDIA.minLng && lng <= INDIA.maxLng;
}

/** Reads `{ lat, lng }` from a loosely shaped server object, or null when it is not a valid point. */
export function toLatLng(raw: unknown): LatLng | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const point = { lat: Number(record.lat ?? record.latitude), lng: Number(record.lng ?? record.longitude) };
  return isValidLatLng(point) ? point : null;
}

/** "350 m" under a kilometre, "1.2 km" above. */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Google Maps directions link (opens the Maps app on both platforms). */
export function mapsDirectionsUrl(destination: LatLng): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}
