import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { buildSlots, activeSlot } from '../../shift/slots.ts';
import { DEMO_KITCHENS } from '../demoData.ts';
import { DEMO_TOKEN, isDemoToken, isDemoSession, syncDemoSession } from '../demoSession.ts';
import {
  addDistance,
  currentShift,
  endShift,
  getWorld,
  nextTarget,
  resetWorld,
  setOrderStatus,
  slotConfig,
  startRide,
  startShift,
  startingPoint,
  tickKitchens,
} from '../demoState.ts';
import { haversineMeters } from '../../../lib/geo.ts';

beforeEach(() => resetWorld());

describe('demo session flag', () => {
  it('follows the token', () => {
    syncDemoSession(DEMO_TOKEN);
    assert.equal(isDemoSession(), true);
    syncDemoSession('real-jwt');
    assert.equal(isDemoSession(), false);
    assert.equal(isDemoToken(null), false);
  });
});

describe('demo world', () => {
  it('starts with five orders and no shift', () => {
    assert.equal(getWorld().orders.length, 5);
    assert.equal(currentShift(), null);
  });

  it('parks the rider inside the 100 m attendance gate', () => {
    assert.ok(haversineMeters(startingPoint(), DEMO_KITCHENS[0]!.location) < 100);
  });

  it('keeps a slot open at every hour of the day', () => {
    for (const hour of [0, 3, 9, 10, 12, 15, 18, 23]) {
      const now = new Date(2026, 9, 21, hour, 15);
      resetWorld();
      const slots = buildSlots(slotConfig(now));
      assert.ok(activeSlot(slots, now), `no open slot at ${hour}:15`);
    }
  });

  it('marks the slow kitchen ready only after its delay', () => {
    startShift(100, 'DEMO-1', getWorld().mealType);
    const start = getWorld().shiftStartedMs!;
    const before = tickKitchens(start + 1_000).filter((o) => o.orderstatus === 'readyToDelivery');
    assert.equal(before.length, 3);
    const after = tickKitchens(start + 60_000).filter((o) => o.orderstatus === 'readyToDelivery');
    assert.equal(after.length, 5);
  });

  it('does not change anything when the same status is set twice', () => {
    const first = setOrderStatus('demo-order-1', 'readyToDelivery');
    const again = setOrderStatus('demo-order-1', 'readyToDelivery');
    assert.equal(again, first);
    assert.equal(getWorld().orders[0]!.statusHistory.length, first!.statusHistory.length);
  });

  it('returns null for an unknown order', () => {
    assert.equal(setOrderStatus('nope', 'delivered'), null);
  });
});

describe('simulator targets', () => {
  it('has no target before the shift starts', () => {
    assert.equal(nextTarget(startingPoint()), null);
  });

  it('heads to the nearest kitchen, then to customers on the way', () => {
    startShift(0, 'DEMO-1', getWorld().mealType);
    assert.equal(nextTarget(startingPoint())?.key, 'kitchen:A');

    for (const order of getWorld().orders) setOrderStatus(order._id, 'handedOverToDeliveryBoy');
    assert.equal(nextTarget(startingPoint()), null);

    assert.equal(startRide(), 5);
    assert.ok(nextTarget(startingPoint())?.key.startsWith('customer:'));
    assert.equal(currentShift()?.stage, 'delivery_stage');
  });
});

describe('ending a shift', () => {
  it('books a held incentive and a pending ledger entry', () => {
    startShift(0, 'DEMO-1', getWorld().mealType);
    setOrderStatus('demo-order-1', 'delivered');
    addDistance(2.5);
    const ended = endShift();
    assert.equal(ended?.status, 'completed');
    assert.equal(ended?.totalActualKm, 2.5);
    const world = getWorld();
    assert.equal(world.extraIncentives.length, 1);
    assert.equal(world.extraIncentives[0]!.status, 'holding');
    assert.equal(world.extraLedger[0]!.type, 'pending');
  });

  it('ignores distance once the shift is over', () => {
    startShift(0, 'DEMO-1', getWorld().mealType);
    endShift();
    addDistance(5);
    assert.equal(currentShift()?.totalActualKm, 0);
  });
});
