/** Who received the food, recorded with the delivery proof (the same options as the Ionic app). */
export const HANDOVER_OPTIONS = [
  'Customer HandOver',
  'Doorstep',
  'Security/Guard',
  'Customer Not Reachable',
] as const;

export type HandOverOption = (typeof HANDOVER_OPTIONS)[number];

export function isHandOverOption(value: string): value is HandOverOption {
  return (HANDOVER_OPTIONS as readonly string[]).includes(value);
}

/** Delivery needs the rider to say how the food was handed over before the photo. */
export function canConfirmDelivery(handOverTo: string): boolean {
  return isHandOverOption(handOverTo);
}
