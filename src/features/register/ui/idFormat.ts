/** Pure display helpers for the ID document step (no React Native imports, so they are unit tested). */

export const AADHAAR_LENGTH = 12;

/** Groups Aadhaar digits in fours for typing: "123456789012" becomes "1234 5678 9012". */
export function formatAadhaar(digits: string): string {
  const clean = digits.replace(/\D/g, '').slice(0, AADHAAR_LENGTH);
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * Hides all but the last four digits of a complete Aadhaar number: "XXXX - XXXX - 4829".
 * Returns null while the number is incomplete, so the caller keeps showing what is being typed.
 */
export function maskAadhaar(digits: string): string | null {
  const clean = digits.replace(/\D/g, '');
  if (clean.length !== AADHAAR_LENGTH) return null;
  return `XXXX - XXXX - ${clean.slice(-4)}`;
}

/** What the Aadhaar field shows: masked once complete and not being edited, otherwise grouped digits. */
export function aadhaarDisplay(digits: string, focused: boolean): string {
  if (!focused) {
    const masked = maskAadhaar(digits);
    if (masked) return masked;
  }
  return formatAadhaar(digits);
}

export function isCompleteAadhaar(digits: string): boolean {
  return digits.replace(/\D/g, '').length === AADHAAR_LENGTH;
}

/** PAN as typed: upper case, letters and digits only, at most 10 characters. */
export function normalisePan(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

/** Driving licence number as typed: upper case, with spaces and dashes kept, trimmed at the start. */
export function normaliseLicence(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9 -]/g, '').replace(/^\s+/, '').slice(0, 20);
}
