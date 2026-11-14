import type { LatLng } from '@/lib/geo';

/** The part of FormData we use, so tests can pass a recording fake. */
export interface ShiftFormLike {
  append: (name: string, value: string | SelfieFile) => void;
}

/** A selfie in the shape React Native's FormData accepts as a file part. */
export interface SelfieFile {
  uri: string;
  name: string;
  type: string;
}

export interface StartShiftInput {
  riderId: string;
  routeNo: string;
  mealSlot: string;
  selfie: SelfieFile;
  /** The odometer reading typed by the rider, in km. */
  startKm: number;
  /** Photo of the odometer showing that reading. */
  odometerPhoto: SelfieFile;
  location: LatLng;
  /** ISO timestamp of when the selfie was taken. */
  startedAt: string;
  deviceInfo: string;
}

export interface EndShiftInput {
  shiftId: string;
  /** The odometer reading typed by the rider at the end of the shift, in km. */
  endKm: number;
  /** Photo of the odometer showing that reading. */
  odometerPhoto: SelfieFile;
}

/** Builds the multipart body for `POST /api/rider/shift/end`: the shift, the end reading and its photo. */
export function buildEndShiftFormData<T extends ShiftFormLike>(input: EndShiftInput, form: T): T {
  form.append('shiftId', input.shiftId);
  form.append('endKm', String(input.endKm));
  form.append('odometerPhoto', input.odometerPhoto);
  return form;
}

/**
 * Builds the multipart body for `POST /api/rider/shift/start`. Field names are the ones
 * the Ionic app sends: riderId, photo, latitude, longitude, startedAt, routeNo, mealSlot, deviceInfo, plus the
 * new startKm and odometerPhoto.
 */
export function buildShiftFormData<T extends ShiftFormLike>(input: StartShiftInput, form: T): T {
  form.append('riderId', input.riderId);
  form.append('photo', input.selfie);
  form.append('startKm', String(input.startKm));
  form.append('odometerPhoto', input.odometerPhoto);
  form.append('latitude', String(input.location.lat));
  form.append('longitude', String(input.location.lng));
  form.append('startedAt', input.startedAt);
  form.append('routeNo', input.routeNo);
  form.append('mealSlot', input.mealSlot);
  form.append('deviceInfo', input.deviceInfo);
  return form;
}
