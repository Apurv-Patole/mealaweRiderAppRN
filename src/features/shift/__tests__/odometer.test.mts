import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cleanKmInput, MAX_SHIFT_KM, parseEndKm, parseStartKm } from '../odometer.ts';

describe('parseStartKm', () => {
  it('accepts a normal reading', () => {
    assert.deepEqual(parseStartKm('12450'), { ok: true, km: 12450 });
    assert.deepEqual(parseStartKm(' 12450.5 '), { ok: true, km: 12450.5 });
  });

  it('refuses blank, zero and too-large readings', () => {
    assert.equal(parseStartKm('').ok, false);
    assert.equal(parseStartKm('0').ok, false);
    assert.equal(parseStartKm('10000000').ok, false);
  });
});

describe('parseEndKm', () => {
  it('accepts a reading at or above the start', () => {
    assert.deepEqual(parseEndKm('12480', 12450), { ok: true, km: 12480 });
    assert.deepEqual(parseEndKm('12450', 12450), { ok: true, km: 12450 });
  });

  it('refuses a reading lower than the start and names the start reading', () => {
    const result = parseEndKm('12400', 12450);
    assert.equal(result.ok, false);
    assert.match(result.ok ? '' : result.error, /12450 km/);
  });

  it('refuses a distance no shift could cover, but accepts exactly the limit', () => {
    assert.equal(parseEndKm(String(12450 + MAX_SHIFT_KM + 1), 12450).ok, false);
    assert.equal(parseEndKm(String(12450 + MAX_SHIFT_KM), 12450).ok, true);
  });

  it('applies only the basic checks when the shift started without a reading', () => {
    assert.deepEqual(parseEndKm('5000', null), { ok: true, km: 5000 });
    assert.equal(parseEndKm('', null).ok, false);
    assert.equal(parseEndKm('0', null).ok, false);
  });
});

describe('cleanKmInput', () => {
  it('keeps digits and one decimal place', () => {
    assert.equal(cleanKmInput('12a450'), '12450');
    assert.equal(cleanKmInput('12450.55'), '12450.5');
    assert.equal(cleanKmInput('1.2.3'), '1.2');
  });
});
