import * as Location from 'expo-location';

import { placeToAddressPatch } from './addressDetect';
import type { AddressDraft } from './leadForm';

export type DetectResult =
  | { status: 'ok'; patch: Partial<AddressDraft> }
  /** Location permission was refused. */
  | { status: 'denied' }
  /** No position, no address for it, or no pincode in it. */
  | { status: 'unavailable' };

const GEOCODE_TIMEOUT_MS = 8_000;

/** Reads the phone's position and reverse-geocodes it into a pincode (plus city and state). Never throws. */
export async function detectAddressFromLocation(): Promise<DetectResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const places = await Promise.race([
      Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), GEOCODE_TIMEOUT_MS)),
    ]);
    const patch = placeToAddressPatch(places?.[0]);
    return patch.pincode ? { status: 'ok', patch } : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}
