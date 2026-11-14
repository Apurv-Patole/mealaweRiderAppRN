import { z } from 'zod';

import { OTP, PHONE } from '@/config/constants';

/** Indian mobile numbers: 10 digits starting 6 to 9. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^[6-9]\\d{${PHONE.length - 1}}$`), 'Enter a valid 10-digit mobile number');

export const otpSchema = z
  .string()
  .trim()
  .regex(new RegExp(`^\\d{${OTP.length}}$`), `Enter the ${OTP.length}-digit code`);

/** Keeps digits only and caps the length (for controlled numeric inputs). */
export function digitsOnly(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

/** First validation message, or null when the value is valid. */
export function firstError(schema: z.ZodType<string>, value: string): string | null {
  const result = schema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? 'Invalid value');
}
