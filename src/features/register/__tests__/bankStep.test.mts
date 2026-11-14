import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import {
  buildLeadFormData,
  emptyDraft,
  firstInvalidStep,
  isValidIfsc,
  isValidUpiId,
  validateStep,
  type DocumentFile,
  type LeadDraft,
} from '../leadForm.ts';
import { progressLabel, STEP_HEADINGS, STEP_PRIMARY_LABEL, backLabel } from '../ui/registerContent.ts';
import { REGISTER_COLORS as C } from '../ui/registerTheme.ts';

const NOW = new Date(Date.UTC(2026, 10, 4));

function draftWith(patch: Partial<LeadDraft>): LeadDraft {
  return { ...emptyDraft(), name: 'Asha Patil', phoneNo: '9876543210', ...patch };
}

describe('isValidIfsc', () => {
  it('accepts a well-formed code in any case', () => {
    assert.equal(isValidIfsc('SBIN0001234'), true);
    assert.equal(isValidIfsc('sbin0001234'), true);
    assert.equal(isValidIfsc(' SBIN0001234 '), true);
  });

  it('rejects short, long and malformed codes', () => {
    assert.equal(isValidIfsc('SBIN123'), false);
    assert.equal(isValidIfsc('SBIN1001234'), false);
    assert.equal(isValidIfsc('SBIN00012345'), false);
    assert.equal(isValidIfsc(''), false);
  });
});

describe('isValidUpiId', () => {
  it('accepts name@handle and number@handle', () => {
    assert.equal(isValidUpiId('asha@okaxis'), true);
    assert.equal(isValidUpiId('9876543210@upi'), true);
    assert.equal(isValidUpiId('asha.patil-1_2@ybl'), true);
  });

  it('rejects ids with no handle, a bad handle, spaces or nothing before the @', () => {
    assert.equal(isValidUpiId('asha'), false);
    assert.equal(isValidUpiId('asha@'), false);
    assert.equal(isValidUpiId('@okaxis'), false);
    assert.equal(isValidUpiId('asha@ok axis'), false);
    assert.equal(isValidUpiId('asha@123'), false);
    assert.equal(isValidUpiId(''), false);
  });
});

describe('confirm account number', () => {
  it('flags a confirmation that does not match', () => {
    const errors = validateStep('bank', draftWith({ bankAccountNo: '109283746501', bankAccountNoConfirm: '109283746500' }), NOW);
    assert.equal(errors.bankAccountNoConfirm, 'Account numbers do not match');
  });

  it('flags an account number that was never confirmed', () => {
    const errors = validateStep('bank', draftWith({ bankAccountNo: '109283746501' }), NOW);
    assert.equal(errors.bankAccountNoConfirm, 'Account numbers do not match');
  });

  it('passes when both match, and when no account number is given at all', () => {
    assert.deepEqual(validateStep('bank', draftWith({ bankAccountNo: '1092', bankAccountNoConfirm: '1092' }), NOW), {});
    assert.deepEqual(validateStep('bank', draftWith({}), NOW), {});
  });

  it('ignores surrounding spaces when comparing', () => {
    assert.deepEqual(validateStep('bank', draftWith({ bankAccountNo: '1092', bankAccountNoConfirm: ' 1092 ' }), NOW), {});
  });

  it('is caught by the whole-form check on the bank step', () => {
    const found = firstInvalidStep(draftWith({ bankAccountNo: '1092' }), NOW);
    assert.equal(found?.step, 'bank');
  });

  it('is never sent to the server', () => {
    const sent: string[] = [];
    buildLeadFormData(draftWith({ bankAccountNo: '1092', bankAccountNoConfirm: '1092' }), {
      append: (name: string, _value: string | DocumentFile) => void sent.push(name),
    });
    assert.ok(sent.includes('bankAccountNo'));
    assert.ok(!sent.includes('bankAccountNoConfirm'));
  });
});

describe('IFSC rule still applies', () => {
  it('rejects a bad IFSC on the bank step', () => {
    assert.equal(
      validateStep('bank', draftWith({ bankIfscCode: 'SBIN123' }), NOW).bankIfscCode,
      'Enter a valid IFSC code, for example SBIN0001234',
    );
  });
});

describe('step 4 copy', () => {
  it('uses the Figma heading, button and back link', () => {
    assert.equal(STEP_HEADINGS.bank.title, 'Bank account & UPI');
    assert.equal(
      STEP_HEADINGS.bank.subtitle,
      'Where would you like to receive your weekly delivery earnings and shift incentives?',
    );
    assert.equal(STEP_PRIMARY_LABEL.bank, 'Submit Application');
    assert.equal(backLabel('bank'), 'Review previous steps');
  });

  it('labels the last progress "Final"', () => {
    assert.equal(progressLabel(100), '100% Final');
  });
});

describe('step 4 colours', () => {
  it('passes AA for the in-field buttons, the SPEED pill and the success text', () => {
    assert.ok(contrastRatio(C.onGreen, C.green) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.ink, C.limeBright) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.limePillInk, C.limePill) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.success, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.body, C.upiTile) >= MIN_TEXT_CONTRAST);
  });
});
