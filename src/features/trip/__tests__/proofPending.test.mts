import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createPendingProof,
  isPendingProofUsable,
  parsePendingProof,
  PENDING_PROOF_MAX_AGE_MS,
} from '../proofPending.ts';

const NOW = 5_000_000;

const BASE = {
  kind: 'pickup' as const,
  orders: [{ orderId: 'o1', orderNo: '1042' }, { orderId: 'o2', orderNo: '1043' }],
  location: { lat: 18.52, lng: 73.85 },
  riderId: 'r1',
  shiftId: 's1',
  handOverTo: '',
};

describe('proof recovery', () => {
  it('creates a record with the save time', () => {
    assert.equal(createPendingProof(BASE, NOW).savedAt, NOW);
  });

  it('round-trips a valid record', () => {
    const pending = createPendingProof(BASE, NOW);
    assert.deepEqual(parsePendingProof(JSON.parse(JSON.stringify(pending))), pending);
  });

  it('keeps a delivery handover and a missing location', () => {
    const parsed = parsePendingProof({ ...createPendingProof({ ...BASE, kind: 'delivery', handOverTo: 'Doorstep', location: null }, NOW) });
    assert.equal(parsed?.handOverTo, 'Doorstep');
    assert.equal(parsed?.location, null);
  });

  it('drops malformed orders but keeps the good ones, and rejects a record with none', () => {
    const pending = { ...createPendingProof(BASE, NOW), orders: [null, 'x', { orderId: '' }, { orderId: 'o9' }] };
    assert.deepEqual(parsePendingProof(pending)?.orders, [{ orderId: 'o9', orderNo: 'o9' }]);
    assert.equal(parsePendingProof({ ...pending, orders: [null] }), null);
  });

  it('rejects records that are missing or malformed', () => {
    const valid = createPendingProof(BASE, NOW);
    for (const bad of [null, undefined, 'x', {}, { ...valid, kind: 'teleport' }, { ...valid, riderId: '' }, { ...valid, shiftId: '' }, { ...valid, savedAt: 'now' }, { ...valid, orders: [] }]) {
      assert.equal(parsePendingProof(bad), null, JSON.stringify(bad));
    }
  });

  it('is usable for the same rider within the age limit only', () => {
    const pending = createPendingProof(BASE, NOW);
    assert.equal(isPendingProofUsable(pending, 'r1', NOW + 1000), true);
    assert.equal(isPendingProofUsable(pending, 'r1', NOW + PENDING_PROOF_MAX_AGE_MS), true);
    assert.equal(isPendingProofUsable(pending, 'r1', NOW + PENDING_PROOF_MAX_AGE_MS + 1), false);
    assert.equal(isPendingProofUsable(pending, 'r2', NOW + 1000), false);
    assert.equal(isPendingProofUsable(pending, 'r1', NOW - 1), false);
  });
});
