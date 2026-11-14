import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeOrders, type RiderOrder } from '@/features/orders/orderModel';

import {
  customerStopsByDistance,
  formatRouteKm,
  isDeliveryStarted,
  rideStarted,
  MAX_LEG_KM,
  planRoute,
  stageOf,
} from '../routePlanner.ts';

const RIDER = { lat: 18.5, lng: 73.85 };

function order(id: string, status: string, kitchen: [number, number] | null, customer: [number, number] | null, kitchenName = 'K'): Record<string, unknown> {
  return {
    _id: id,
    orderNo: id,
    mealType: 'Lunch',
    orderstatus: status,
    kitchenName,
    kitchenGeolocation: kitchen ? { lat: kitchen[0], lng: kitchen[1] } : undefined,
    customerName: `Cust ${id}`,
    customerLocation: { address: `Addr ${id}`, geolocation: customer ? { lat: customer[0], lng: customer[1] } : undefined },
  };
}

function build(rows: Record<string, unknown>[]): RiderOrder[] {
  return normalizeOrders(rows);
}

describe('planRoute', () => {
  it('visits every kitchen first (nearest next), then customers (nearest next)', () => {
    const orders = build([
      order('1', 'accepted', [18.51, 73.85], [18.7, 73.9], 'Near'),
      order('2', 'preparing', [18.6, 73.85], [18.52, 73.86], 'Far'),
    ]);
    const plan = planRoute(orders, RIDER);
    assert.deepEqual(plan.stops.map((stop) => stop.id.split(':')[0]), ['kitchen', 'kitchen', 'customer', 'customer']);
    assert.deepEqual(plan.stops.slice(0, 2).map((stop) => stop.name), ['Near', 'Far']);
    // After the last kitchen (Far, at 18.6) the nearer customer comes first: order 2 (18.52) is 0.08 away, order 1 (18.7) is 0.10 away.
    assert.deepEqual(plan.stops.slice(2).map((stop) => stop.orders[0]?.id), ['2', '1']);
  });

  it('merges orders from the same kitchen into one stop', () => {
    const orders = build([
      order('1', 'accepted', [18.51, 73.85], [18.7, 73.9]),
      order('2', 'accepted', [18.51, 73.85], [18.6, 73.9]),
    ]);
    const kitchens = planRoute(orders, RIDER).stops.filter((stop) => stop.type === 'kitchen');
    assert.equal(kitchens.length, 1);
    assert.equal(kitchens[0]?.orders.length, 2);
  });

  it('makes each picked-up order its own customer stop, with no kitchen stop', () => {
    const orders = build([order('1', 'handedOverToDeliveryBoy', [18.51, 73.85], [18.7, 73.9]), order('2', 'ontheway', [18.51, 73.85], [18.6, 73.9])]);
    const plan = planRoute(orders, RIDER);
    assert.deepEqual(plan.stops.map((stop) => stop.type), ['customer', 'customer']);
  });

  it('leaves out done and cancelled orders', () => {
    const orders = build([order('1', 'delivered', [18.51, 73.85], [18.7, 73.9]), order('2', 'cancelledByUser', [18.51, 73.85], [18.6, 73.9])]);
    assert.deepEqual(planRoute(orders, RIDER).stops, []);
  });

  it('reports orders with missing coordinates instead of inventing a point', () => {
    const orders = build([
      order('1', 'accepted', null, [18.7, 73.9]),
      order('2', 'accepted', [18.51, 73.85], null),
      order('3', 'accepted', [18.51, 73.85], [18.6, 73.9]),
    ]);
    const plan = planRoute(orders, RIDER);
    assert.deepEqual(plan.skipped.map((s) => [s.orderId, s.reason]), [['1', 'Kitchen location is missing'], ['2', 'Customer location is missing']]);
    assert.equal(plan.stops.filter((stop) => stop.type === 'kitchen').length, 1);
  });

  it('annotates distances from the rider and between stops, and totals realistic legs', () => {
    const orders = build([order('1', 'accepted', [18.51, 73.85], [18.52, 73.86])]);
    const plan = planRoute(orders, RIDER);
    assert.ok((plan.stops[0]?.distanceFromRiderKm ?? 0) > 1);
    assert.ok((plan.stops[1]?.distanceFromPrevKm ?? 0) > 0);
    assert.ok(plan.totalKm > 0 && plan.totalKm < MAX_LEG_KM);
  });

  it('excludes an absurd leg (bad geocode) from the total', () => {
    const orders = build([order('1', 'accepted', [28.6, 77.2], [28.61, 77.21])]); // Delhi, ~1,400 km from Pune
    assert.equal(planRoute(orders, RIDER).totalKm < 5, true);
  });

  it('plans without a rider location, starting at the first kitchen', () => {
    const orders = build([order('1', 'accepted', [18.51, 73.85], [18.7, 73.9])]);
    const plan = planRoute(orders, null);
    assert.equal(plan.stops.length, 2);
    assert.equal(plan.stops[0]?.distanceFromPrevKm, null);
    assert.equal(plan.stops[0]?.distanceFromRiderKm, null);
  });

  it('does not mutate its input', () => {
    const orders = build([order('1', 'accepted', [18.51, 73.85], [18.7, 73.9])]);
    const copy = JSON.stringify(orders);
    planRoute(orders, RIDER);
    assert.equal(JSON.stringify(orders), copy);
  });
});

describe('stageOf', () => {
  const pickup = planRoute(build([order('1', 'accepted', [18.51, 73.85], [18.7, 73.9])]), RIDER);
  const bag = planRoute(build([order('1', 'handedOverToDeliveryBoy', [18.51, 73.85], [18.7, 73.9])]), RIDER);
  const nothing = planRoute([], RIDER);

  it('is pickup while any kitchen has orders waiting', () => {
    assert.equal(stageOf(pickup, 1, false), 'pickup');
    assert.equal(stageOf(pickup, 1, true), 'pickup');
  });

  it('is ready, then delivery, once everything is picked up', () => {
    assert.equal(stageOf(bag, 1, false), 'ready');
    assert.equal(stageOf(bag, 1, true), 'delivery');
  });

  it('is complete when orders existed but none are left, and empty when there are none', () => {
    assert.equal(stageOf(nothing, 3, false), 'complete');
    assert.equal(stageOf(nothing, 0, false), 'empty');
  });
});

describe('isDeliveryStarted', () => {
  it('is true once any order is on the way', () => {
    assert.equal(isDeliveryStarted(build([order('1', 'ontheway', [18.5, 73.8], [18.6, 73.9])])), true);
    assert.equal(isDeliveryStarted(build([order('1', 'outForDelivery', [18.5, 73.8], [18.6, 73.9])])), true);
    assert.equal(isDeliveryStarted(build([order('1', 'handedOverToDeliveryBoy', [18.5, 73.8], [18.6, 73.9])])), false);
    assert.equal(isDeliveryStarted([]), false);
  });
});

describe('rideStarted', () => {
  const onTheWay = build([order('1', 'ontheway', [18.5, 73.8], [18.6, 73.9])]);
  const pickedUp = build([order('1', 'handedOverToDeliveryBoy', [18.5, 73.8], [18.6, 73.9])]);

  it('is true when an order is on the way, whatever was saved', () => {
    assert.equal(rideStarted(onTheWay, null, 's1'), true);
  });

  it('is true when the ride for this shift was started from this phone', () => {
    assert.equal(rideStarted(pickedUp, 's1', 's1'), true);
  });

  it('ignores a saved flag from a different shift, or when there is no shift', () => {
    assert.equal(rideStarted(pickedUp, 's0', 's1'), false);
    assert.equal(rideStarted(pickedUp, 's1', null), false);
    assert.equal(rideStarted(pickedUp, null, 's1'), false);
  });
});

describe('customerStopsByDistance', () => {
  it('sorts customers by live distance from the rider and ignores kitchens', () => {
    const plan = planRoute(
      build([
        order('far', 'handedOverToDeliveryBoy', [18.5, 73.8], [18.7, 73.9]),
        order('near', 'handedOverToDeliveryBoy', [18.5, 73.8], [18.51, 73.85]),
        order('wait', 'accepted', [18.5, 73.8], [18.55, 73.9]),
      ]),
      RIDER,
    );
    // The order still at its kitchen ('wait') also becomes a customer stop once that kitchen is visited.
    const sorted = customerStopsByDistance(plan.stops, RIDER);
    assert.deepEqual(sorted.map((stop) => stop.orders[0]?.id), ['near', 'wait', 'far']);
    assert.ok(sorted.every((stop) => stop.type === 'customer'));
  });

  it('keeps planner order when the rider location is unknown', () => {
    const plan = planRoute(build([order('a', 'ontheway', [18.5, 73.8], [18.6, 73.9])]), null);
    assert.equal(customerStopsByDistance(plan.stops, null).length, 1);
  });
});

describe('formatRouteKm', () => {
  it('formats metres and kilometres and hides unbelievable totals', () => {
    assert.equal(formatRouteKm(0.4), '400 m');
    assert.equal(formatRouteKm(12.34), '12.3 km');
    assert.equal(formatRouteKm(0), null);
    assert.equal(formatRouteKm(101), null);
    assert.equal(formatRouteKm(Number.NaN), null);
  });
});
