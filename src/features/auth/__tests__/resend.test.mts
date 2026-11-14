import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resendDeadline, secondsUntil } from '../resend.ts';

describe('resend countdown', () => {
  it('sets the deadline resendSeconds after now', () => {
    assert.equal(resendDeadline(1_000, 30), 31_000);
  });

  it('counts whole seconds left, rounding up', () => {
    const deadline = resendDeadline(0, 30);
    assert.equal(secondsUntil(deadline, 0), 30);
    assert.equal(secondsUntil(deadline, 1), 30);
    assert.equal(secondsUntil(deadline, 1_000), 29);
    assert.equal(secondsUntil(deadline, 29_001), 1);
  });

  it('is 0 at and after the deadline, never negative', () => {
    const deadline = resendDeadline(0, 30);
    assert.equal(secondsUntil(deadline, 30_000), 0);
    assert.equal(secondsUntil(deadline, 99_000), 0);
  });
});
