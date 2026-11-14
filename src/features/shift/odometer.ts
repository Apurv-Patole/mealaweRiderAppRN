/** Odometer readings at the start and end of a shift (pure, no React Native imports). */
export const MAX_ODOMETER_KM = 9_999_999;

/** One shift cannot plausibly cover more than this many km (the server refuses more, so we say so first). */
export const MAX_SHIFT_KM = 1000;

export type KmResult = { ok: true; km: number } | { ok: false; error: string };

/** Keeps only digits and one decimal point, with at most one decimal place (odometers show tenths at most). */
export function cleanKmInput(raw: string): string {
  const stripped = raw.replace(/[^0-9.]/g, '');
  const [whole = '', ...rest] = stripped.split('.');
  if (rest.length === 0) return whole.slice(0, 7);
  return `${whole.slice(0, 7)}.${rest.join('').slice(0, 1)}`;
}

/**
 * Checks the reading typed at the end of a shift: a valid reading, not lower than the start reading, and not
 * an implausible distance more than it. `startKm` is null for a shift that started without a reading.
 */
export function parseEndKm(text: string, startKm: number | null): KmResult {
  const parsed = parseStartKm(text);
  if (!parsed.ok || startKm === null) return parsed;
  if (parsed.km < startKm) return { ok: false, error: `This is lower than your start reading (${startKm} km). Check the odometer again` };
  if (parsed.km - startKm > MAX_SHIFT_KM) return { ok: false, error: 'That is too far for one shift. Check the odometer again' };
  return parsed;
}

/** Checks the typed reading. A reading of zero is rejected: a vehicle in use has driven some distance. */
export function parseStartKm(text: string): KmResult {
  const cleaned = text.trim();
  if (cleaned === '') return { ok: false, error: 'Enter the reading shown on your odometer' };
  const km = Number(cleaned);
  if (!Number.isFinite(km)) return { ok: false, error: 'Enter numbers only, for example 12450' };
  if (km <= 0) return { ok: false, error: 'The reading must be more than zero' };
  if (km > MAX_ODOMETER_KM) return { ok: false, error: 'That reading is too large. Check the odometer again' };
  return { ok: true, km };
}
