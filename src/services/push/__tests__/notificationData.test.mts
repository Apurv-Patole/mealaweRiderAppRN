import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parsePushData } from '../notificationData.ts';

describe('parsePushData', () => {
  it('parses an attendance reminder with its meal slot', () => {
    assert.deepEqual(parsePushData({ type: 'ATTENDANCE_REMINDER', mealSlot: 'Lunch' }), {
      type: 'ATTENDANCE_REMINDER',
      mealSlot: 'Lunch',
    });
  });

  it('defaults a missing meal slot to an empty string', () => {
    assert.deepEqual(parsePushData({ type: 'ATTENDANCE_REMINDER' }), { type: 'ATTENDANCE_REMINDER', mealSlot: '' });
  });

  it('parses order assigned and order ready', () => {
    assert.deepEqual(parsePushData({ type: 'ORDER_ASSIGNED' }), { type: 'ORDER_ASSIGNED' });
    assert.deepEqual(parsePushData({ type: 'ORDER_READY', orderNo: '12' }), { type: 'ORDER_READY' });
  });

  it('parses the admin decision on a cancel request', () => {
    assert.deepEqual(parsePushData({ type: 'CANCEL_UPDATE', decision: 'resolved', orderNo: '1042' }), {
      type: 'CANCEL_UPDATE',
      decision: 'resolved',
      orderNo: '1042',
    });
  });

  it('parses the planned customer-cancel and order-updated events', () => {
    assert.deepEqual(parsePushData({ type: 'ORDER_CANCELLED_BY_USER', orderNo: '7' }), {
      type: 'ORDER_CANCELLED_BY_USER',
      orderNo: '7',
    });
    assert.deepEqual(parsePushData({ type: 'ORDER_UPDATED', orderNo: '8' }), { type: 'ORDER_UPDATED', orderNo: '8' });
  });

  it('ignores non-string field values instead of coercing them', () => {
    assert.deepEqual(parsePushData({ type: 'CANCEL_UPDATE', decision: 5, orderNo: null }), {
      type: 'CANCEL_UPDATE',
      decision: '',
      orderNo: '',
    });
  });

  it('returns null for unknown types and non-objects', () => {
    assert.equal(parsePushData({ type: 'RIDER_LOCATION_UPDATE' }), null);
    assert.equal(parsePushData({}), null);
    assert.equal(parsePushData(undefined), null);
    assert.equal(parsePushData('ORDER_READY'), null);
    assert.equal(parsePushData(null), null);
  });
});
