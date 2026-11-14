import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ageOn,
  buildLeadFormData,
  emptyDraft,
  firstInvalidStep,
  formatDobInput,
  parseDob,
  validateStep,
  withDocument,
  type DocumentFile,
  type LeadDraft,
} from '../leadForm.ts';

const NOW = new Date(Date.UTC(2026, 9, 21)); // 21 Oct 2026

function draftWith(patch: Partial<LeadDraft>): LeadDraft {
  return { ...emptyDraft(), name: 'Asha Patil', phoneNo: '9876543210', ...patch };
}

describe('formatDobInput', () => {
  it('inserts slashes as digits are typed and ignores everything else', () => {
    assert.equal(formatDobInput('1'), '1');
    assert.equal(formatDobInput('150'), '15/0');
    assert.equal(formatDobInput('15031'), '15/03/1');
    assert.equal(formatDobInput('15/03/1995'), '15/03/1995');
    assert.equal(formatDobInput('15a03b19955555'), '15/03/1995');
  });
});

describe('parseDob', () => {
  it('converts a real date to ISO', () => {
    assert.equal(parseDob('15/03/1995'), '1995-03-15');
    assert.equal(parseDob('29/02/2000'), '2000-02-29');
  });

  it('rejects impossible dates and bad shapes', () => {
    for (const bad of ['', '31/02/1995', '29/02/2001', '00/01/1990', '15/13/1990', '1/1/1990', '15-03-1995', '15/03/1850']) {
      assert.equal(parseDob(bad), null, bad);
    }
  });
});

describe('ageOn', () => {
  it('counts whole years and respects the birthday', () => {
    assert.equal(ageOn('2000-10-21', NOW), 26);
    assert.equal(ageOn('2000-10-22', NOW), 25);
    assert.equal(ageOn('2000-01-01', NOW), 26);
    assert.equal(ageOn('2008-10-21', NOW), 18);
  });
});

describe('validateStep personal', () => {
  it('passes with only a name and a valid phone', () => {
    assert.deepEqual(validateStep('personal', draftWith({}), NOW), {});
  });

  it('requires a name of at least 2 characters and a valid phone', () => {
    const errors = validateStep('personal', draftWith({ name: 'A', phoneNo: '12345' }), NOW);
    assert.equal(errors.name, 'Enter your full name');
    assert.equal(errors.phoneNo, 'Enter a valid 10-digit mobile number');
  });

  it('checks optional fields only when filled in', () => {
    const errors = validateStep(
      'personal',
      draftWith({ email: 'not-an-email', emergencyContactNo: '1234567890' }),
      NOW,
    );
    assert.equal(errors.email, 'Enter a valid email address');
    assert.equal(errors.emergencyContactNo, 'Enter a valid 10-digit mobile number');
    assert.deepEqual(validateStep('personal', draftWith({ email: 'a@b.co', emergencyContactNo: '9000000000' }), NOW), {});
  });

  it('enforces the 18 to 60 age range', () => {
    assert.equal(validateStep('personal', draftWith({ dateOfBirth: '22/10/2008' }), NOW).dateOfBirth, 'You must be at least 18 years old');
    assert.equal(validateStep('personal', draftWith({ dateOfBirth: '21/10/1965' }), NOW).dateOfBirth, 'The maximum age is 60');
    assert.equal(validateStep('personal', draftWith({ dateOfBirth: '21/10/2008' }), NOW).dateOfBirth, undefined);
    assert.equal(validateStep('personal', draftWith({ dateOfBirth: '31/02/1995' }), NOW).dateOfBirth, 'Enter the date as DD/MM/YYYY');
  });
});

describe('validateStep address / kyc / bank', () => {
  it('checks pincodes, and skips the permanent address when it is the same', () => {
    const base = draftWith({ residenceAddress: { ...emptyDraft().residenceAddress, pincode: '41100' } });
    assert.equal(validateStep('address', base, NOW)['residenceAddress.pincode'], 'Pincode must be 6 digits');

    const permanentBad = draftWith({
      permanentSameAsResidence: false,
      permanentAddress: { ...emptyDraft().permanentAddress, pincode: 'abc' },
    });
    assert.equal(validateStep('address', permanentBad, NOW)['permanentAddress.pincode'], 'Pincode must be 6 digits');

    const sameIgnored = draftWith({ permanentAddress: { ...emptyDraft().permanentAddress, pincode: 'abc' } });
    assert.deepEqual(validateStep('address', sameIgnored, NOW), {});
  });

  it('checks Aadhaar and PAN formats, accepting lowercase PAN', () => {
    assert.equal(validateStep('kyc', draftWith({ aadharNo: '1234' }), NOW).aadharNo, 'Aadhaar number must be 12 digits');
    assert.equal(validateStep('kyc', draftWith({ panNo: 'abcde123' }), NOW).panNo, 'Enter a valid PAN, for example ABCDE1234F');
    assert.deepEqual(validateStep('kyc', draftWith({ aadharNo: '123412341234', panNo: 'abcde1234f' }), NOW), {});
  });

  it('checks the IFSC format, accepting lowercase', () => {
    assert.equal(validateStep('bank', draftWith({ bankIfscCode: 'SBIN123' }), NOW).bankIfscCode, 'Enter a valid IFSC code, for example SBIN0001234');
    assert.deepEqual(validateStep('bank', draftWith({ bankIfscCode: 'sbin0001234' }), NOW), {});
  });
});

describe('firstInvalidStep', () => {
  it('is null for a valid form', () => {
    assert.equal(firstInvalidStep(draftWith({}), NOW), null);
  });

  it('returns the earliest invalid step with its errors', () => {
    const result = firstInvalidStep(draftWith({ aadharNo: '1', bankIfscCode: 'x' }), NOW);
    assert.equal(result?.step, 'kyc');
    assert.ok(result?.errors.aadharNo);
  });
});

class RecordingForm {
  readonly entries: Array<[string, string | DocumentFile]> = [];
  append(name: string, value: string | DocumentFile): void {
    this.entries.push([name, value]);
  }
  get(name: string): string | DocumentFile | undefined {
    return this.entries.find(([key]) => key === name)?.[1];
  }
}

describe('withDocument', () => {
  const front: DocumentFile = { uri: 'file:///f.jpg', name: 'f.jpg', type: 'image/jpeg' };
  const back: DocumentFile = { uri: 'file:///b.jpg', name: 'b.jpg', type: 'image/jpeg' };

  it('adds or replaces a document without mutating the original', () => {
    const original = { aadharFrontUrl: front };
    const next = withDocument(original, 'aadharBackUrl', back);
    assert.deepEqual(next, { aadharFrontUrl: front, aadharBackUrl: back });
    assert.deepEqual(original, { aadharFrontUrl: front });
    assert.deepEqual(withDocument(next, 'aadharFrontUrl', back).aadharFrontUrl, back);
  });

  it('removes a document when the file is undefined', () => {
    const next = withDocument({ aadharFrontUrl: front, aadharBackUrl: back }, 'aadharFrontUrl', undefined);
    assert.deepEqual(next, { aadharBackUrl: back });
  });
});

describe('buildLeadFormData', () => {
  it('sends only filled text fields, normalised', () => {
    const form = buildLeadFormData(
      draftWith({ email: ' Asha@Mail.COM ', dateOfBirth: '15/03/1995', panNo: 'abcde1234f', bankIfscCode: 'sbin0001234' }),
      new RecordingForm(),
    );
    assert.equal(form.get('name'), 'Asha Patil');
    assert.equal(form.get('phoneNo'), '9876543210');
    assert.equal(form.get('email'), 'asha@mail.com');
    assert.equal(form.get('dateOfBirth'), '1995-03-15');
    assert.equal(form.get('panNo'), 'ABCDE1234F');
    assert.equal(form.get('bankIfscCode'), 'SBIN0001234');
    assert.equal(form.get('bloodGroup'), undefined);
    assert.equal(form.get('upiId'), undefined);
  });

  it('sends addresses as JSON and copies the residence when permanent is the same', () => {
    const residence = { line1: ' 12 MG Road ', line2: '', city: 'Pune', state: 'Maharashtra', pincode: '411001' };
    const form = buildLeadFormData(draftWith({ residenceAddress: residence }), new RecordingForm());
    const expected = JSON.stringify({ line1: '12 MG Road', line2: '', city: 'Pune', state: 'Maharashtra', pincode: '411001' });
    assert.equal(form.get('residenceAddress'), expected);
    assert.equal(form.get('permanentAddress'), expected);
  });

  it('uses the separate permanent address when it differs', () => {
    const permanent = { line1: 'Village Rd', line2: '', city: 'Satara', state: 'Maharashtra', pincode: '415001' };
    const form = buildLeadFormData(
      draftWith({ permanentSameAsResidence: false, permanentAddress: permanent }),
      new RecordingForm(),
    );
    assert.equal(JSON.parse(String(form.get('permanentAddress'))).city, 'Satara');
  });

  it('attaches picked documents as file parts under the server field names', () => {
    const file: DocumentFile = { uri: 'file:///a.jpg', name: 'a.jpg', type: 'image/jpeg' };
    const form = buildLeadFormData(draftWith({ documents: { aadharFrontUrl: file } }), new RecordingForm());
    assert.deepEqual(form.get('aadharFrontUrl'), file);
    assert.equal(form.get('aadharBackUrl'), undefined);
  });
});
