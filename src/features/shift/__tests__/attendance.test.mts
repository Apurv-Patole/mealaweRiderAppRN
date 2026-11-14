import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canMarkAttendance, evaluateGate, type GateInput } from '../attendanceGate.ts';
import { lifecycleOf, summariseKitchens, type KitchenStop } from '../kitchen.ts';

const KITCHEN_LOC = { lat: 18.5204, lng: 73.8567 };
const KITCHEN: KitchenStop = { name: 'Asha Kitchen', address1: 'MG Road', address2: '', location: KITCHEN_LOC, orderCount: 3 };
// about 55 m north, and about 1.1 km north
const NEAR = { lat: 18.5204 + 0.0005, lng: 73.8567 };
const FAR = { lat: 18.5204 + 0.01, lng: 73.8567 };

const BASE: GateInput = {
  online: false,
  routeNo: '7',
  slotOpen: true,
  permissionsReady: true,
  ordersLoading: false,
  kitchen: KITCHEN,
  riderLocation: NEAR,
  proximityM: 100,
};

describe('lifecycleOf', () => {
  it('buckets statuses the way the Ionic planner does, ignoring case, spaces and separators', () => {
    assert.equal(lifecycleOf({ orderstatus: 'readyToDelivery' }), 'prePickup');
    assert.equal(lifecycleOf({ orderstatus: 'Ready For Delivery' }), 'prePickup');
    assert.equal(lifecycleOf({ orderstatus: 'preparing' }), 'prePickup');
    assert.equal(lifecycleOf({ orderstatus: 'accepted' }), 'prePickup');
    assert.equal(lifecycleOf({ orderstatus: 'handedOverToDeliveryBoy' }), 'postPickup');
    assert.equal(lifecycleOf({ orderstatus: 'on_the_way' }), 'postPickup');
    assert.equal(lifecycleOf({ orderstatus: 'delivered' }), 'done');
    assert.equal(lifecycleOf({ orderstatus: 'cancelledByUser' }), 'cancelled');
    assert.equal(lifecycleOf({ orderstatus: 'rejectedByKitchen' }), 'cancelled');
    assert.equal(lifecycleOf({ orderstatus: 'placed' }), 'unknown');
  });

  it('falls back to riderStatus and status, and handles junk', () => {
    assert.equal(lifecycleOf({ riderStatus: 'accepted' }), 'prePickup');
    assert.equal(lifecycleOf({ status: 'delivered' }), 'done');
    assert.equal(lifecycleOf({}), 'unknown');
    assert.equal(lifecycleOf(null), 'unknown');
  });
});

function order(status: string, lat: number, lng: number, name = 'K') {
  return { orderstatus: status, kitchenName: name, kitchenGeolocation: { lat, lng }, kitchenAddress: { address1: ' MG Road ' } };
}

describe('summariseKitchens', () => {
  it('counts only pre-pickup orders and groups them by kitchen', () => {
    const summary = summariseKitchens(
      [order('accepted', 18.5204, 73.8567, 'A'), order('preparing', 18.5204, 73.8567, 'A'), order('delivered', 18.5204, 73.8567, 'A'), order('ontheway', 18.5204, 73.8567, 'A')],
      null,
    );
    assert.equal(summary.pendingOrders, 2);
    assert.equal(summary.first?.orderCount, 2);
    assert.equal(summary.first?.name, 'A');
    assert.equal(summary.first?.address1, 'MG Road');
  });

  it('picks the kitchen nearest to the rider', () => {
    const orders = [order('accepted', 18.6, 73.9, 'Far'), order('accepted', 18.5206, 73.8569, 'Near')];
    assert.equal(summariseKitchens(orders, KITCHEN_LOC).first?.name, 'Near');
  });

  it('uses the first kitchen when the rider location is unknown', () => {
    const orders = [order('accepted', 18.6, 73.9, 'First'), order('accepted', 18.5206, 73.8569, 'Second')];
    assert.equal(summariseKitchens(orders, null).first?.name, 'First');
  });

  it('counts orders whose kitchen cannot be located but returns no kitchen for them', () => {
    const summary = summariseKitchens([{ orderstatus: 'accepted', kitchenGeolocation: { lat: 0, lng: 0 } }, { orderstatus: 'accepted' }], KITCHEN_LOC);
    assert.equal(summary.pendingOrders, 2);
    assert.equal(summary.first, null);
  });

  it('defaults the kitchen name and is empty for no orders', () => {
    assert.equal(summariseKitchens([{ orderstatus: 'accepted', kitchenGeolocation: { lat: 18.52, lng: 73.85 } }], null).first?.name, 'Kitchen');
    assert.deepEqual(summariseKitchens([], null), { pendingOrders: 0, first: null });
  });
});

describe('evaluateGate', () => {
  it('is online when a shift is running, whatever else is true', () => {
    assert.equal(evaluateGate({ ...BASE, online: true, routeNo: null, slotOpen: false }).kind, 'online');
  });

  it('checks the conditions in order: route, slot, permissions, orders', () => {
    assert.equal(evaluateGate({ ...BASE, routeNo: null }).kind, 'noRoute');
    assert.equal(evaluateGate({ ...BASE, slotOpen: false }).kind, 'noSlot');
    assert.equal(evaluateGate({ ...BASE, permissionsReady: false }).kind, 'needsPermissions');
    assert.equal(evaluateGate({ ...BASE, ordersLoading: true }).kind, 'loadingOrders');
  });

  it('waits for the rider location when a kitchen is assigned', () => {
    assert.equal(evaluateGate({ ...BASE, riderLocation: null }).kind, 'gettingLocation');
  });

  it('allows attendance within the proximity limit, including exactly at it', () => {
    const gate = evaluateGate(BASE);
    assert.equal(gate.kind, 'ready');
    assert.ok(gate.kind === 'ready' && gate.distanceM !== null && gate.distanceM < 100);
    assert.equal(evaluateGate({ ...BASE, riderLocation: KITCHEN_LOC }).kind, 'ready');
  });

  it('blocks attendance when too far, reporting the distance', () => {
    const gate = evaluateGate({ ...BASE, riderLocation: FAR });
    assert.equal(gate.kind, 'tooFar');
    assert.ok(gate.kind === 'tooFar' && gate.distanceM > 1000);
  });

  it('allows attendance with no kitchen to check against', () => {
    const gate = evaluateGate({ ...BASE, kitchen: null, riderLocation: null });
    assert.deepEqual(gate, { kind: 'ready', kitchen: null, distanceM: null });
  });

  it('respects a different proximity limit', () => {
    assert.equal(evaluateGate({ ...BASE, riderLocation: FAR, proximityM: 5000 }).kind, 'ready');
  });
});

describe('canMarkAttendance', () => {
  it('is true only for the ready state', () => {
    assert.equal(canMarkAttendance(evaluateGate(BASE)), true);
    assert.equal(canMarkAttendance(evaluateGate({ ...BASE, riderLocation: FAR })), false);
    assert.equal(canMarkAttendance(evaluateGate({ ...BASE, online: true })), false);
    assert.equal(canMarkAttendance(evaluateGate({ ...BASE, slotOpen: false })), false);
  });
});
