import type { AddressDraft } from './leadForm';

/** The parts of a reverse-geocoded place we use (a subset of expo-location's `LocationGeocodedAddress`). */
export interface GeocodedPlace {
  postalCode?: string | null;
  city?: string | null;
  subregion?: string | null;
  region?: string | null;
}

const PINCODE_RE = /^\d{6}$/;

function clean(value: string | null | undefined): string {
  return (value ?? '').trim();
}

/** What "Detect pincode" can fill in from a place: the pincode (only when it is a real 6 digits), city and state. */
export function placeToAddressPatch(place: GeocodedPlace | null | undefined): Partial<AddressDraft> {
  if (!place) return {};
  const patch: Partial<AddressDraft> = {};
  const pincode = clean(place.postalCode).replace(/\s/g, '');
  if (PINCODE_RE.test(pincode)) patch.pincode = pincode;
  const city = clean(place.city) || clean(place.subregion);
  if (city) patch.city = city;
  const state = clean(place.region);
  if (state) patch.state = state;
  return patch;
}

/**
 * Merges a detected patch into an address without ever overwriting what the rider already typed:
 * the pincode is always taken (that is what they asked for), city and state only fill blanks.
 */
export function mergeDetected(address: AddressDraft, patch: Partial<AddressDraft>): AddressDraft {
  return {
    ...address,
    pincode: patch.pincode ?? address.pincode,
    city: address.city.trim() ? address.city : (patch.city ?? address.city),
    state: address.state.trim() ? address.state : (patch.state ?? address.state),
  };
}
