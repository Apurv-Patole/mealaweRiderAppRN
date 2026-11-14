/** Edit-profile model: what a rider can change, validation and the upload body (pure, no React Native imports). */
export interface EditAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ProfileDraft {
  name: string;
  email: string;
  emergencyContactNo: string;
  bloodGroup: string;
  bankAccountHolder: string;
  bankName: string;
  bankAccountNo: string;
  bankIfscCode: string;
  bankBranch: string;
  upiId: string;
  residenceAddress: EditAddress;
}

export interface PhotoFile {
  uri: string;
  name: string;
  type: string;
}

export type ProfileErrors = Partial<Record<string, string>>;

/** Pictures the rider can replace: the profile photo and the ID documents asked for at registration. */
export interface ProfileImageField {
  /** The upload field name, and the key for newly picked files. */
  key: string;
  /** Where the server's rider document keeps the current picture's URL. */
  urlKey: string;
  label: string;
}

export const PROFILE_PHOTO: ProfileImageField = { key: 'imageUrl', urlKey: 'imageUrl', label: 'Profile photo' };

export const PROFILE_DOCUMENTS: readonly ProfileImageField[] = [
  { key: 'aadharFront', urlKey: 'aadharProofUrl', label: 'Aadhaar front' },
  { key: 'aadharBack', urlKey: 'aadharBackUrl', label: 'Aadhaar back' },
  { key: 'panProof', urlKey: 'panProofUrl', label: 'PAN card' },
  { key: 'drivingLicence', urlKey: 'drivingLicenceUrl', label: 'Driving licence' },
  { key: 'bankProof', urlKey: 'bankProofUrl', label: 'Bank proof' },
  { key: 'upiQr', urlKey: 'upiQrUrl', label: 'UPI QR code' },
];

/** Current picture URLs from the server's rider document, by upload key (empty string when none). */
export function imageUrlsFromRaw(raw: unknown): Record<string, string> {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries([PROFILE_PHOTO, ...PROFILE_DOCUMENTS].map((field) => [field.key, text(record[field.urlKey])]));
}

const EMPTY_ADDRESS: EditAddress = { line1: '', line2: '', city: '', state: '', pincode: '' };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PIN_RE = /^\d{6}$/;
const UPI_RE = /^[\w.-]{2,}@[A-Za-z]{2,}$/;

function text(value: unknown): string {
  return typeof value === 'string' ? value : value === null || value === undefined ? '' : String(value);
}

function addressFrom(value: unknown): EditAddress {
  if (!value || typeof value !== 'object') return EMPTY_ADDRESS;
  const record = value as Record<string, unknown>;
  return {
    line1: text(record.line1),
    line2: text(record.line2),
    city: text(record.city),
    state: text(record.state),
    pincode: text(record.pincode),
  };
}

/** Builds the editable draft from the server's rider document. */
export function draftFromRaw(raw: unknown): ProfileDraft {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    name: text(record.name),
    email: text(record.email),
    emergencyContactNo: text(record.emergencyContactNo),
    bloodGroup: text(record.bloodGroup),
    bankAccountHolder: text(record.bankAccountHolder),
    bankName: text(record.bankName),
    bankAccountNo: text(record.bankAccountNo),
    bankIfscCode: text(record.bankIfscCode),
    bankBranch: text(record.bankBranch),
    upiId: text(record.upiId),
    residenceAddress: addressFrom(record.residenceAddress),
  };
}

const filled = (value: string) => value.trim().length > 0;

/** Field-by-field problems. Only name is required; the rest are checked only when filled in. */
export function validateProfile(draft: ProfileDraft): ProfileErrors {
  const errors: ProfileErrors = {};
  if (!filled(draft.name)) errors.name = 'Enter your name';
  if (filled(draft.email) && !EMAIL_RE.test(draft.email.trim())) errors.email = 'Enter a valid email address';
  if (filled(draft.emergencyContactNo) && !PHONE_RE.test(draft.emergencyContactNo.trim())) {
    errors.emergencyContactNo = 'Enter a valid 10-digit number';
  }
  if (filled(draft.bankIfscCode) && !IFSC_RE.test(draft.bankIfscCode.trim().toUpperCase())) {
    errors.bankIfscCode = 'Enter a valid IFSC code, for example SBIN0001234';
  }
  if (filled(draft.upiId) && !UPI_RE.test(draft.upiId.trim())) errors.upiId = 'Enter a valid UPI ID, for example name@bank';
  if (filled(draft.residenceAddress.pincode) && !PIN_RE.test(draft.residenceAddress.pincode.trim())) {
    errors['residenceAddress.pincode'] = 'Enter a 6-digit pincode';
  }
  return errors;
}

interface FormTarget {
  append: (name: string, value: string | PhotoFile) => void;
}

/** Writes the multipart body the profile-update endpoint expects (the same field names as the old rider app). */
export function buildProfileFormData(draft: ProfileDraft, files: Readonly<Record<string, PhotoFile>>, form: FormTarget): void {
  form.append('name', draft.name.trim());
  form.append('email', draft.email.trim());
  form.append('emergencyContactNo', draft.emergencyContactNo.trim());
  form.append('bloodGroup', draft.bloodGroup.trim());
  form.append('bankAccountHolder', draft.bankAccountHolder.trim());
  form.append('bankName', draft.bankName.trim());
  form.append('bankAccountNo', draft.bankAccountNo.trim());
  form.append('bankIfscCode', draft.bankIfscCode.trim().toUpperCase());
  form.append('bankBranch', draft.bankBranch.trim());
  form.append('upiId', draft.upiId.trim());
  form.append('residenceAddress', JSON.stringify(draft.residenceAddress));
  for (const [key, file] of Object.entries(files)) form.append(key, file);
}
