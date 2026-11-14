import { ENDPOINTS, http } from '@/services/http';

import { normalizeRiderProfile, type RiderProfile } from './riderProfile';

interface VerifyOtpResponse {
  token: string;
}

/** Sends the login OTP. Throws `HttpError` if the number is not a registered, active rider. */
export async function sendOtp(phoneNo: string): Promise<void> {
  await http.post(ENDPOINTS.auth.sendOtp, { phoneNo }, { skipUnauthorizedHandler: true });
}

/** Verifies the OTP and returns the session token. */
export async function verifyOtp(phoneNo: string, otp: string): Promise<string> {
  const response = await http.post<VerifyOtpResponse>(
    ENDPOINTS.auth.verifyOtp,
    { phoneNo, password: otp },
    { skipUnauthorizedHandler: true },
  );
  if (!response?.token) {
    throw new Error('Login failed. Please try again.');
  }
  return response.token;
}

/** Loads the signed-in rider's profile (resolved from the JWT). */
export async function fetchProfile(fallbackPhone = ''): Promise<RiderProfile | null> {
  const raw = await http.get<unknown>(ENDPOINTS.profile.me);
  return normalizeRiderProfile(raw, fallbackPhone);
}

/** Best-effort server logout; the local session is cleared by the caller regardless. */
export async function logout(): Promise<void> {
  try {
    await http.get(ENDPOINTS.auth.logout, { skipUnauthorizedHandler: true });
  } catch {
    // the token may already be invalid; nothing more to do
  }
}
