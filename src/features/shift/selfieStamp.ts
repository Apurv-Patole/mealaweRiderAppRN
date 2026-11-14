import type { LatLng } from '@/lib/geo';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** "23 Oct 2026, 6:18:42 PM" in the phone's local time. */
export function formatStampTime(date: Date): string {
  const hours = date.getHours();
  const clock = `${hours % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${clock} ${hours >= 12 ? 'PM' : 'AM'}`;
}

/** "18.59740, 73.78980" (five decimals is about one metre). */
export function formatStampCoordinates(location: LatLng): string {
  return `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`;
}

/** The text printed on the selfie: time, GPS position, and the street or area when it is known. */
export function stampLines(time: Date, location: LatLng, address: string | null): string[] {
  const lines = [formatStampTime(time), `GPS ${formatStampCoordinates(location)}`];
  if (address) lines.push(address);
  return lines;
}

interface GeocodedPlace {
  name?: string | null;
  street?: string | null;
  district?: string | null;
  subregion?: string | null;
  city?: string | null;
  region?: string | null;
}

/** A short address ("Street, Area, City") from a reverse-geocoding result, or null when it has nothing useful. */
export function addressFromPlace(place: GeocodedPlace | undefined): string | null {
  if (!place) return null;
  const parts = [place.street ?? place.name, place.district ?? place.subregion, place.city ?? place.region]
    .map((part) => (part ?? '').trim())
    .filter((part, index, all) => part.length > 0 && all.indexOf(part) === index);
  return parts.length > 0 ? parts.join(', ') : null;
}
