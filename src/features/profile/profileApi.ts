import { normalizeRiderProfile, type RiderProfile } from '@/features/auth';
import { appendPart } from '@/lib/formParts';
import { ENDPOINTS, http } from '@/services/http';

import { buildProfileFormData, type PhotoFile, type ProfileDraft } from './profileEdit';

/** The signed-in rider's full document from the server, for the edit form. */
export async function fetchProfileDetails(): Promise<unknown> {
  return http.get<unknown>(ENDPOINTS.profile.me);
}

/**
 * Saves the edited profile (and any new pictures that were chosen). Returns the updated rider so the
 * app's copy of the profile can be refreshed, or null if the server sent nothing usable back.
 */
export async function saveProfile(
  draft: ProfileDraft,
  files: Readonly<Record<string, PhotoFile>>,
  fallbackPhone: string,
): Promise<RiderProfile | null> {
  const form = new FormData();
  buildProfileFormData(draft, files, { append: (name, value) => appendPart(form, name, value) });
  const raw = await http.post<unknown>(ENDPOINTS.profile.update, form);
  return normalizeRiderProfile(raw, fallbackPhone);
}
