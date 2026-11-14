/**
 * Rider registration ("lead") form: types, validation and the multipart payload.
 * Pure (no React Native imports) so it is unit-tested. Rules mirror the Ionic app
 * (`riderAppAI` rider-register page): only name and phone are required; every other
 * field is optional but must match its format when filled in.
 */
export const LEAD_STEPS = ['personal', 'address', 'kyc', 'bank'] as const;
export type LeadStep = (typeof LEAD_STEPS)[number];

export const LEAD_STEP_TITLES: Record<LeadStep, string> = {
  personal: 'About you',
  address: 'Address',
  kyc: 'ID documents',
  bank: 'Bank and UPI',
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const MIN_AGE = 18;
export const MAX_AGE = 60;

const PHONE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;
const AADHAR_RE = /^\d{12}$/;
const PAN_RE = /^[A-Z]{5}\d{4}[A-Z]$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
/** UPI handle: a name, an @, then the bank or app handle (for example `asha@okaxis`). */
const UPI_RE = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

/** True for a well-formed IFSC code (accepts lowercase). Format only: it does not check the bank exists. */
export function isValidIfsc(code: string): boolean {
  return IFSC_RE.test(code.trim().toUpperCase());
}

/** True for a well-formed UPI ID. Format only: it does not check the account exists. */
export function isValidUpiId(id: string): boolean {
  return UPI_RE.test(id.trim());
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AddressDraft {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export type DocumentKey =
  | 'aadharFrontUrl'
  | 'aadharBackUrl'
  | 'panProofUrl'
  | 'drivingLicenceUrl'
  | 'bankProofUrl'
  | 'upiQrUrl';

/** A picked image, in the shape React Native's FormData accepts. */
export interface DocumentFile {
  uri: string;
  name: string;
  type: string;
}

export interface LeadDraft {
  name: string;
  phoneNo: string;
  email: string;
  /** As typed: DD/MM/YYYY. Converted to ISO on submit. */
  dateOfBirth: string;
  bloodGroup: string;
  emergencyContactNo: string;
  residenceAddress: AddressDraft;
  permanentAddress: AddressDraft;
  permanentSameAsResidence: boolean;
  aadharNo: string;
  panNo: string;
  drivingLicenceNo: string;
  bankAccountHolder: string;
  bankName: string;
  bankAccountNo: string;
  /** The account number typed a second time. Checked against `bankAccountNo`, never sent. */
  bankAccountNoConfirm: string;
  bankIfscCode: string;
  bankBranch: string;
  upiId: string;
  documents: Partial<Record<DocumentKey, DocumentFile>>;
}

export const EMPTY_ADDRESS: AddressDraft = { line1: '', line2: '', city: '', state: '', pincode: '' };

export function emptyDraft(): LeadDraft {
  return {
    name: '',
    phoneNo: '',
    email: '',
    dateOfBirth: '',
    bloodGroup: '',
    emergencyContactNo: '',
    residenceAddress: EMPTY_ADDRESS,
    permanentAddress: EMPTY_ADDRESS,
    permanentSameAsResidence: true,
    aadharNo: '',
    panNo: '',
    drivingLicenceNo: '',
    bankAccountHolder: '',
    bankName: '',
    bankAccountNo: '',
    bankAccountNoConfirm: '',
    bankIfscCode: '',
    bankBranch: '',
    upiId: '',
    documents: {},
  };
}

// ── Date of birth ───────────────────────────────────────────────

/** Turns typed digits into DD/MM/YYYY (inserting the slashes), capped at 8 digits. */
export function formatDobInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** "DD/MM/YYYY" to "YYYY-MM-DD", or null when it is not a real calendar date. */
export function parseDob(text: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isReal || year < 1900) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/** Whole years between an ISO date of birth and `now`. */
export function ageOn(isoDob: string, now: Date): number {
  const [year = 0, month = 1, day = 1] = isoDob.split('-').map(Number);
  const hadBirthday =
    now.getUTCMonth() + 1 > month || (now.getUTCMonth() + 1 === month && now.getUTCDate() >= day);
  return now.getUTCFullYear() - year - (hadBirthday ? 0 : 1);
}

/** A new documents map with one picture set (or removed when `file` is undefined). */
export function withDocument(
  documents: LeadDraft['documents'],
  key: DocumentKey,
  file: DocumentFile | undefined,
): LeadDraft['documents'] {
  const rest = Object.fromEntries(
    Object.entries(documents).filter(([name]) => name !== key),
  ) as LeadDraft['documents'];
  return file ? { ...rest, [key]: file } : rest;
}

// ── Validation ──────────────────────────────────────────────────

/** Error messages by field key. Address fields use `residenceAddress.pincode`-style keys. */
export type LeadErrors = Partial<Record<string, string>>;

function filled(value: string): boolean {
  return value.trim().length > 0;
}

function validateAddress(prefix: string, address: AddressDraft, errors: Record<string, string>): void {
  if (filled(address.pincode) && !PIN_RE.test(address.pincode.trim())) {
    errors[`${prefix}.pincode`] = 'Pincode must be 6 digits';
  }
}

export function validateStep(step: LeadStep, draft: LeadDraft, now: Date = new Date()): LeadErrors {
  const errors: Record<string, string> = {};

  switch (step) {
    case 'personal': {
      if (draft.name.trim().length < 2) errors.name = 'Enter your full name';
      if (!PHONE_RE.test(draft.phoneNo.trim())) errors.phoneNo = 'Enter a valid 10-digit mobile number';
      if (filled(draft.email) && !EMAIL_RE.test(draft.email.trim())) errors.email = 'Enter a valid email address';
      if (filled(draft.emergencyContactNo) && !PHONE_RE.test(draft.emergencyContactNo.trim())) {
        errors.emergencyContactNo = 'Enter a valid 10-digit mobile number';
      }
      if (filled(draft.dateOfBirth)) {
        const iso = parseDob(draft.dateOfBirth);
        if (!iso) {
          errors.dateOfBirth = 'Enter the date as DD/MM/YYYY';
        } else {
          const age = ageOn(iso, now);
          if (age < MIN_AGE) errors.dateOfBirth = `You must be at least ${MIN_AGE} years old`;
          else if (age > MAX_AGE) errors.dateOfBirth = `The maximum age is ${MAX_AGE}`;
        }
      }
      break;
    }
    case 'address': {
      validateAddress('residenceAddress', draft.residenceAddress, errors);
      if (!draft.permanentSameAsResidence) validateAddress('permanentAddress', draft.permanentAddress, errors);
      break;
    }
    case 'kyc': {
      if (filled(draft.aadharNo) && !AADHAR_RE.test(draft.aadharNo.trim())) {
        errors.aadharNo = 'Aadhaar number must be 12 digits';
      }
      if (filled(draft.panNo) && !PAN_RE.test(draft.panNo.trim().toUpperCase())) {
        errors.panNo = 'Enter a valid PAN, for example ABCDE1234F';
      }
      break;
    }
    case 'bank': {
      if (filled(draft.bankAccountNo) && draft.bankAccountNo.trim() !== draft.bankAccountNoConfirm.trim()) {
        errors.bankAccountNoConfirm = 'Account numbers do not match';
      }
      if (filled(draft.bankIfscCode) && !isValidIfsc(draft.bankIfscCode)) {
        errors.bankIfscCode = 'Enter a valid IFSC code, for example SBIN0001234';
      }
      break;
    }
  }
  return errors;
}

/** The first step that has errors (with those errors), or null when the whole form is valid. */
export function firstInvalidStep(
  draft: LeadDraft,
  now: Date = new Date(),
): { step: LeadStep; errors: LeadErrors } | null {
  for (const step of LEAD_STEPS) {
    const errors = validateStep(step, draft, now);
    if (Object.keys(errors).length > 0) return { step, errors };
  }
  return null;
}

// ── Payload ─────────────────────────────────────────────────────

/** The part of FormData we use, so tests can pass a recording fake. */
export interface FormDataLike {
  append: (name: string, value: string | DocumentFile) => void;
}

function addressPayload(address: AddressDraft): string {
  return JSON.stringify({
    line1: address.line1.trim(),
    line2: address.line2.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    pincode: address.pincode.trim(),
  });
}

/**
 * Builds the multipart body for `POST /api/saveRiderLead`. Empty text fields are left
 * out (the server fills defaults); the two addresses are JSON strings and the documents
 * are file parts. "Permanent same as residence" copies the residence address.
 */
export function buildLeadFormData<T extends FormDataLike>(draft: LeadDraft, form: T): T {
  const text: [string, string][] = [
    ['name', draft.name.trim()],
    ['phoneNo', draft.phoneNo.trim()],
    ['email', draft.email.trim().toLowerCase()],
    ['dateOfBirth', parseDob(draft.dateOfBirth) ?? ''],
    ['bloodGroup', draft.bloodGroup],
    ['emergencyContactNo', draft.emergencyContactNo.trim()],
    ['aadharNo', draft.aadharNo.trim()],
    ['panNo', draft.panNo.trim().toUpperCase()],
    ['drivingLicenceNo', draft.drivingLicenceNo.trim().toUpperCase()],
    ['bankAccountHolder', draft.bankAccountHolder.trim()],
    ['bankName', draft.bankName.trim()],
    ['bankAccountNo', draft.bankAccountNo.trim()],
    ['bankIfscCode', draft.bankIfscCode.trim().toUpperCase()],
    ['bankBranch', draft.bankBranch.trim()],
    ['upiId', draft.upiId.trim()],
  ];
  for (const [name, value] of text) {
    if (value) form.append(name, value);
  }

  form.append('residenceAddress', addressPayload(draft.residenceAddress));
  form.append(
    'permanentAddress',
    addressPayload(draft.permanentSameAsResidence ? draft.residenceAddress : draft.permanentAddress),
  );

  for (const [key, file] of Object.entries(draft.documents)) {
    if (file) form.append(key, file);
  }
  return form;
}
