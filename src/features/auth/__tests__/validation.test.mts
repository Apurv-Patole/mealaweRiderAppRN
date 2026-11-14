import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { digitsOnly, firstError, otpSchema, phoneSchema } from '../validation.ts';

describe('phoneSchema', () => {
  it('accepts 10-digit Indian mobile numbers starting 6 to 9', () => {
    for (const phone of ['9876543210', '6000000000', '7123456789', '8123456789']) {
      assert.equal(phoneSchema.safeParse(phone).success, true, phone);
    }
  });

  it('rejects wrong length, leading 0 to 5, and non-digits', () => {
    for (const phone of ['', '987654321', '98765432100', '5876543210', '0876543210', '98765abcde', '+919876543210']) {
      assert.equal(phoneSchema.safeParse(phone).success, false, phone);
    }
  });

  it('trims surrounding spaces', () => {
    assert.equal(phoneSchema.safeParse(' 9876543210 ').success, true);
  });
});

describe('otpSchema', () => {
  it('accepts exactly 6 digits', () => {
    assert.equal(otpSchema.safeParse('123456').success, true);
    assert.equal(otpSchema.safeParse('000000').success, true);
  });

  it('rejects other lengths and non-digits', () => {
    for (const otp of ['', '12345', '1234567', '12345a', '12 456']) {
      assert.equal(otpSchema.safeParse(otp).success, false, otp);
    }
  });
});

describe('digitsOnly', () => {
  it('strips non-digits and caps the length', () => {
    assert.equal(digitsOnly('98-76 54a3210999', 10), '9876543210');
    assert.equal(digitsOnly('abc', 6), '');
    assert.equal(digitsOnly('123', 6), '123');
  });
});

describe('firstError', () => {
  it('returns null for a valid value and a message for an invalid one', () => {
    assert.equal(firstError(phoneSchema, '9876543210'), null);
    assert.equal(firstError(phoneSchema, '123'), 'Enter a valid 10-digit mobile number');
    assert.equal(firstError(otpSchema, '12'), 'Enter the 6-digit code');
  });
});
