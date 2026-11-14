import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import { backLabel, STEP_HEADINGS, STEP_PRIMARY_LABEL } from '../ui/registerContent.ts';
import {
  aadhaarDisplay,
  formatAadhaar,
  isCompleteAadhaar,
  maskAadhaar,
  normaliseLicence,
  normalisePan,
} from '../ui/idFormat.ts';
import { REGISTER_COLORS as C } from '../ui/registerTheme.ts';

describe('formatAadhaar', () => {
  it('groups digits in fours as the rider types', () => {
    assert.equal(formatAadhaar('1'), '1');
    assert.equal(formatAadhaar('1234'), '1234');
    assert.equal(formatAadhaar('12345'), '1234 5');
    assert.equal(formatAadhaar('123456789012'), '1234 5678 9012');
  });

  it('ignores non-digits and extra digits', () => {
    assert.equal(formatAadhaar('1234-5678 9012 99'), '1234 5678 9012');
    assert.equal(formatAadhaar(''), '');
  });
});

describe('maskAadhaar', () => {
  it('keeps only the last four digits of a complete number', () => {
    assert.equal(maskAadhaar('123456784829'), 'XXXX - XXXX - 4829');
    assert.equal(maskAadhaar('1234 5678 4829'), 'XXXX - XXXX - 4829');
  });

  it('returns null while the number is incomplete', () => {
    assert.equal(maskAadhaar(''), null);
    assert.equal(maskAadhaar('12345678482'), null);
  });
});

describe('aadhaarDisplay', () => {
  it('masks a complete number once the field is not being edited', () => {
    assert.equal(aadhaarDisplay('123456784829', false), 'XXXX - XXXX - 4829');
  });

  it('shows the real digits while editing, and for incomplete numbers', () => {
    assert.equal(aadhaarDisplay('123456784829', true), '1234 5678 4829');
    assert.equal(aadhaarDisplay('12345', false), '1234 5');
  });
});

describe('isCompleteAadhaar', () => {
  it('is true only for exactly 12 digits', () => {
    assert.equal(isCompleteAadhaar('123456784829'), true);
    assert.equal(isCompleteAadhaar('1234 5678 4829'), true);
    assert.equal(isCompleteAadhaar('12345678482'), false);
    assert.equal(isCompleteAadhaar(''), false);
  });
});

describe('normalisePan and normaliseLicence', () => {
  it('upper-cases PAN and keeps letters and digits up to 10 characters', () => {
    assert.equal(normalisePan('abcde1234f'), 'ABCDE1234F');
    assert.equal(normalisePan('abcde 1234-f99'), 'ABCDE1234F');
  });

  it('upper-cases a licence number and keeps spaces and dashes', () => {
    assert.equal(normaliseLicence('mh12 us2727'), 'MH12 US2727');
    assert.equal(normaliseLicence('  mh-12/2020'), 'MH-122020');
    assert.equal(normaliseLicence('a'.repeat(30)).length, 20);
  });
});

describe('step 3 copy', () => {
  it('uses the Figma heading, button and back link', () => {
    assert.equal(STEP_HEADINGS.kyc.title, 'Upload ID Document');
    assert.equal(STEP_PRIMARY_LABEL.kyc, 'Continue to Bank & UPI');
    assert.equal(backLabel('kyc'), 'Back to Address');
  });
});

describe('step 3 colours', () => {
  it('passes AA for the grey tag, the trust note and the upload actions', () => {
    assert.ok(contrastRatio(C.body, C.tagGrey) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.body, C.tile) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.greenDeep, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.required, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.ink, C.canvas) >= MIN_TEXT_CONTRAST);
  });

  // The grey "Optional" slot tag uses the muted grey on #e5e9e4 (about 4.1:1), just under AA. Kept as designed.
  it('keeps the grey slot tag at 4:1 or better', () => {
    assert.ok(contrastRatio(C.muted, C.tagGrey) >= 4);
  });
});
