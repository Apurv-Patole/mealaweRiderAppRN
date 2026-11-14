import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dayRange, deliveryDateOptions } from '../deliveryDate.ts';
import { formatRupees, normalizeOrder, normalizeOrders, statusLabel, statusTone } from '../orderModel.ts';
import { completionRate, pendingCount, sortForList, statsBySlot } from '../orderStats.ts';

function raw(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'o1',
    orderNo: 1042,
    mealType: 'Lunch',
    orderstatus: 'readyToDelivery',
    kitchenName: ' Asha Kitchen ',
    kitchenPhoneNo: '9000000001',
    kitchenAddress: { address1: 'MG Road', address2: 'Pune', landmark: 'Near temple' },
    kitchenGeolocation: { lat: 18.5204, lng: 73.8567 },
    customerName: 'Ravi',
    customerPhoneNo: '9000000002',
    customerLocation: { address: 'Flat 4', location: 'Baner', landmark: 'Opp mall', geolocation: { lat: 18.559, lng: 73.78 } },
    itemList: [{ itemName: 'Thali', count: 2 }, { itemName: '', count: 1 }, { itemName: 'Curd' }],
    addOns: [{}, {}],
    mealPackage: { packageName: 'Weekly' },
    totalAmount: 250,
    specialRequest: 'Less spicy',
    slotStartTime: '2026-10-21T06:00:00.000Z',
    slotEndTime: 'garbage',
    ...overrides,
  };
}

describe('normalizeOrder', () => {
  it('maps the server order', () => {
    const order = normalizeOrder(raw());
    assert.equal(order?.id, 'o1');
    assert.equal(order?.orderNo, '1042');
    assert.equal(order?.statusKey, 'readytodelivery');
    assert.equal(order?.lifecycle, 'prePickup');
    assert.equal(order?.kitchen.name, 'Asha Kitchen');
    assert.equal(order?.kitchen.address, 'MG Road, Pune');
    assert.deepEqual(order?.kitchen.location, { lat: 18.5204, lng: 73.8567 });
    assert.equal(order?.customer.address, 'Flat 4, Baner');
    assert.equal(order?.customer.landmark, 'Opp mall');
    assert.deepEqual(order?.items, [{ name: 'Thali', count: 2 }, { name: 'Curd', count: 1 }]);
    assert.equal(order?.addOnCount, 2);
    assert.equal(order?.packageName, 'Weekly');
    assert.equal(order?.totalAmount, 250);
    assert.equal(order?.slotStart, '2026-10-21T06:00:00.000Z');
    assert.equal(order?.slotEnd, null);
  });

  it('keeps missing coordinates as null and defaults names', () => {
    const order = normalizeOrder(raw({ kitchenGeolocation: { lat: 0, lng: 0 }, kitchenName: '', customerName: undefined, customerLocation: {} }));
    assert.equal(order?.kitchen.location, null);
    assert.equal(order?.kitchen.name, 'Kitchen');
    assert.equal(order?.customer.name, 'Customer');
    assert.equal(order?.customer.location, null);
  });

  it('returns null without an id, and normalizeOrders drops them', () => {
    assert.equal(normalizeOrder({}), null);
    assert.equal(normalizeOrder(null), null);
    assert.deepEqual(normalizeOrders([raw(), {}, null]).map((order) => order.id), ['o1']);
    assert.deepEqual(normalizeOrders('x'), []);
  });
});

describe('statusLabel / statusTone', () => {
  const cases: [string, string, string][] = [
    ['accepted', 'Accepted', 'assigned'],
    ['preparing', 'Preparing', 'assigned'],
    ['readyToDelivery', 'Ready for pickup', 'ready'],
    ['handedOverToDeliveryBoy', 'Picked up', 'onTheWay'],
    ['onTheWay', 'On the way', 'onTheWay'],
    ['delivered', 'Delivered', 'done'],
    ['cancelledByUser', 'Cancelled', 'cancelled'],
    ['placed', 'Placed', 'offline'],
  ];
  for (const [status, label, tone] of cases) {
    it(`${status} is "${label}" in the ${tone} tone`, () => {
      const order = normalizeOrder(raw({ orderstatus: status }));
      assert.ok(order);
      assert.equal(statusLabel(order), label);
      assert.equal(statusTone(order), tone);
    });
  }
});

describe('formatRupees', () => {
  it('rounds to whole rupees with Indian grouping', () => {
    assert.equal(formatRupees(250.4), '₹250');
    assert.equal(formatRupees(1250), '₹1,250');
    assert.equal(formatRupees(125000), '₹1,25,000');
  });
});

describe('slot stats', () => {
  const orders = normalizeOrders([
    raw({ _id: 'a', mealType: 'Lunch', orderstatus: 'delivered', totalAmount: 100, kitchenName: 'K1' }),
    raw({ _id: 'b', mealType: 'Lunch', orderstatus: 'ontheway', totalAmount: 200, kitchenName: 'K1' }),
    raw({ _id: 'c', mealType: 'Lunch', orderstatus: 'accepted', totalAmount: 300, kitchenName: 'K2' }),
    raw({ _id: 'd', mealType: 'Lunch', orderstatus: 'cancelledByUser', totalAmount: 400, kitchenName: 'K2' }),
    raw({ _id: 'e', mealType: 'Dinner', orderstatus: 'preparing', totalAmount: 50, kitchenName: 'K3' }),
  ]);
  const stats = statsBySlot(orders);

  it('has one row per meal slot in order', () => {
    assert.deepEqual(stats.map((stat) => stat.meal), ['Breakfast', 'Lunch', 'Dinner']);
    assert.equal(stats[0]?.total, 0);
    assert.equal(stats[0]?.progressPct, 0);
  });

  it('counts total, done, picked up, pending, kitchens, income and progress like the server', () => {
    const lunch = stats[1];
    assert.equal(lunch?.total, 4);
    assert.equal(lunch?.done, 1);
    assert.equal(lunch?.pickedUp, 2);
    assert.equal(lunch?.pending, 2);
    assert.equal(lunch?.kitchens, 2);
    assert.equal(lunch?.income, 100);
    assert.equal(lunch?.progressPct, 25);
  });

  it('computes the overall completion rate and pending counts', () => {
    assert.equal(completionRate(stats), 20);
    assert.equal(completionRate(statsBySlot([])), 0);
    assert.equal(pendingCount(orders), 3);
    assert.equal(pendingCount(orders, 'Lunch'), 2);
    assert.equal(pendingCount(orders, 'Breakfast'), 0);
  });
});

describe('sortForList', () => {
  it('puts work to do first, then finished, then cancelled, ordered by number within each group', () => {
    const orders = normalizeOrders([
      raw({ _id: 'a', orderNo: 10, orderstatus: 'delivered' }),
      raw({ _id: 'b', orderNo: 9, orderstatus: 'cancelledByUser' }),
      raw({ _id: 'c', orderNo: 20, orderstatus: 'accepted' }),
      raw({ _id: 'd', orderNo: 3, orderstatus: 'ontheway' }),
      raw({ _id: 'e', orderNo: 100, orderstatus: 'preparing' }),
      raw({ _id: 'f', orderNo: 2, orderstatus: 'delivered' }),
    ]);
    assert.deepEqual(sortForList(orders).map((order) => order.id), ['c', 'e', 'd', 'f', 'a', 'b']);
  });

  it('does not mutate the input', () => {
    const orders = normalizeOrders([raw({ _id: 'x', orderNo: 2 }), raw({ _id: 'y', orderNo: 1 })]);
    sortForList(orders);
    assert.deepEqual(orders.map((order) => order.id), ['x', 'y']);
  });
});

describe('deliveryDateOptions / dayRange', () => {
  const NOW = new Date(2026, 9, 21, 15, 30); // Wed 21 Oct 2026

  it('offers today and the following days, never the past', () => {
    const options = deliveryDateOptions(NOW, 4);
    assert.deepEqual(options.map((option) => option.label), ['Today', 'Tomorrow', 'Fri 23 Oct', 'Sat 24 Oct']);
    assert.deepEqual(options.map((option) => option.offset), [0, 1, 2, 3]);
  });

  it('rolls over month ends', () => {
    const labels = deliveryDateOptions(new Date(2026, 9, 31), 3).map((option) => option.label);
    assert.deepEqual(labels, ['Today', 'Tomorrow', 'Mon 2 Nov']);
  });

  it('covers the whole local day', () => {
    const { fromDate, toDate } = dayRange(NOW);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    assert.equal(from.getHours(), 0);
    assert.equal(from.getMinutes(), 0);
    assert.equal(to.getHours(), 23);
    assert.equal(to.getMinutes(), 59);
    assert.equal(from.getDate(), 21);
    assert.equal(to.getDate(), 21);
  });
});
