import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canSubmitCancel, CANCEL_REASONS, composeCancelReason } from '../cancelReason.ts';

describe('composeCancelReason', () => {
  it('joins the reason and the note', () => {
    assert.equal(composeCancelReason('Cannot reach the customer', ' phone is off '), 'Cannot reach the customer: phone is off');
  });

  it('uses the reason alone, or the note alone', () => {
    assert.equal(composeCancelReason('Problem with my vehicle', ''), 'Problem with my vehicle');
    assert.equal(composeCancelReason('', '  flat tyre '), 'flat tyre');
    assert.equal(composeCancelReason('', '   '), '');
  });
});

describe('canSubmitCancel', () => {
  it('needs a reason or a note', () => {
    assert.equal(canSubmitCancel('', ''), false);
    assert.equal(canSubmitCancel('', '   '), false);
    assert.equal(canSubmitCancel('Something else', ''), true);
    assert.equal(canSubmitCancel('', 'something'), true);
  });
});

describe('CANCEL_REASONS', () => {
  it('offers a catch-all', () => {
    assert.ok(CANCEL_REASONS.includes('Something else'));
  });

  it('uses the five reasons from the design, in order', () => {
    assert.deepEqual([...CANCEL_REASONS], [
      'Cannot reach the customer',
      'Address or landmark is wrong',
      'Kitchen has not handed over the order',
      'Problem with my vehicle',
      'Something else',
    ]);
  });
});
