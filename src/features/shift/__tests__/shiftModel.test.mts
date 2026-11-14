import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isShiftOnline, normalizeShift, statusByMeal, withStatus } from '../shiftModel.ts';

const RAW = {
  _id: 's1',
  riderId: 'r1',
  date: '2026-10-21',
  mealSlot: 'Lunch',
  routeNo: 7,
  status: 'online',
  stage: 'pickup_stage',
  startedAt: '2026-10-21T05:30:00.000Z',
  totalActualKm: 3.5,
};

describe('normalizeShift', () => {
  it('maps a server shift', () => {
    assert.deepEqual(normalizeShift(RAW), {
      id: 's1',
      riderId: 'r1',
      date: '2026-10-21',
      mealSlot: 'Lunch',
      routeNo: '7',
      status: 'online',
      stage: 'pickup_stage',
      startedAt: '2026-10-21T05:30:00.000Z',
      endedAt: null,
      totalActualKm: 3.5,
      startOdometerKm: null,
      endOdometerKm: null,
    });
  });

  it('reads the start and end odometer readings', () => {
    const shift = normalizeShift({ ...RAW, startOdometerKm: 12450, endOdometerKm: '12480.5' });
    assert.equal(shift?.startOdometerKm, 12450);
    assert.equal(shift?.endOdometerKm, 12480.5);
  });

  it('treats a missing, zero or non-numeric odometer reading as none', () => {
    for (const bad of [undefined, null, '', 0, -3, 'abc']) {
      const shift = normalizeShift({ ...RAW, startOdometerKm: bad, endOdometerKm: bad });
      assert.equal(shift?.startOdometerKm, null, String(bad));
      assert.equal(shift?.endOdometerKm, null, String(bad));
    }
  });

  it('returns null for the empty object the server sends when there is no shift', () => {
    assert.equal(normalizeShift({}), null);
    assert.equal(normalizeShift(null), null);
    assert.equal(normalizeShift(undefined), null);
    assert.equal(normalizeShift('x'), null);
  });

  it('defaults odd status and stage values and a missing distance', () => {
    const shift = normalizeShift({ _id: 's2', status: 'weird', stage: 'weird' });
    assert.equal(shift?.status, 'online');
    assert.equal(shift?.stage, 'pickup_stage');
    assert.equal(shift?.totalActualKm, 0);
  });

  it('keeps an end time and the delivery stage', () => {
    const shift = normalizeShift({ ...RAW, status: 'offline', stage: 'delivery_stage', endedAt: '2026-10-21T09:00:00.000Z' });
    assert.equal(shift?.status, 'offline');
    assert.equal(shift?.stage, 'delivery_stage');
    assert.equal(shift?.endedAt, '2026-10-21T09:00:00.000Z');
  });
});

describe('isShiftOnline', () => {
  it('is true only for an online shift', () => {
    assert.equal(isShiftOnline(normalizeShift(RAW)), true);
    assert.equal(isShiftOnline(normalizeShift({ ...RAW, status: 'offline' })), false);
    assert.equal(isShiftOnline(null), false);
  });
});

describe('withStatus', () => {
  it('returns a new map with the slot updated and leaves the original alone', () => {
    const original = { Breakfast: 'completed' as const };
    const next = withStatus(original, 'Lunch', 'online');
    assert.deepEqual(next, { Breakfast: 'completed', Lunch: 'online' });
    assert.deepEqual(original, { Breakfast: 'completed' });
  });

  it('ignores a meal name it does not know', () => {
    const original = { Lunch: 'online' as const };
    assert.equal(withStatus(original, 'Brunch', 'completed'), original);
  });
});

describe('statusByMeal', () => {
  it('maps meal slots to statuses and ignores unknown rows', () => {
    assert.deepEqual(
      statusByMeal([
        { mealSlot: 'Breakfast', status: 'completed' },
        { mealSlot: 'Lunch', status: 'online' },
        { mealSlot: 'Brunch', status: 'online' },
        null,
        'x',
      ]),
      { Breakfast: 'completed', Lunch: 'online' },
    );
  });

  it('is empty for anything that is not a list', () => {
    assert.deepEqual(statusByMeal(undefined), {});
    assert.deepEqual(statusByMeal({}), {});
  });
});
