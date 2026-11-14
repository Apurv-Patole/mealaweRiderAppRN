/**
 * The admin support line, from `EXPO_PUBLIC_SUPPORT_PHONE` (set it in the EAS environment or `.env`).
 * Pure so it is unit tested; when no usable number is set the "Call admin" button is simply not shown.
 */
export function supportTelUrl(raw: string | undefined): string | null {
  const cleaned = (raw ?? '').replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 7) return null;
  // Keep one leading plus, drop any others.
  return `tel:${cleaned.startsWith('+') ? '+' : ''}${digits}`;
}

export const SUPPORT_TEL_URL: string | null = supportTelUrl(process.env.EXPO_PUBLIC_SUPPORT_PHONE);
