import { appendPart } from '@/lib/formParts';
import { ENDPOINTS, http, HttpError } from '@/services/http';

import { buildLeadFormData, type LeadDraft } from './leadForm';

/** Shown when the server fails to save; the usual cause is a phone number that already applied. */
export const DUPLICATE_HINT =
  'We could not save your request. If you have already applied with this number, our team will contact you.';

/** Submits the registration. Throws an `Error` with a message that is safe to show the rider. */
export async function submitLead(draft: LeadDraft): Promise<void> {
  const form = new FormData();
  buildLeadFormData(draft, {
    append: (name, value) => appendPart(form, name, value),
  });

  try {
    await http.post(ENDPOINTS.lead.submit, form, { skipUnauthorizedHandler: true });
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      if (error.status === 402) throw new Error(error.message);
      if (error.status >= 500) throw new Error(DUPLICATE_HINT);
    }
    throw error;
  }
}
