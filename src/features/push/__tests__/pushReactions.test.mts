import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { reactToPush } from '../pushReactions.ts';

describe('reactToPush', () => {
  it('does nothing for an unknown event', () => {
    assert.deepEqual(reactToPush(null, 'foreground'), { refreshOrders: false, banner: null, route: null });
  });

  it('refreshes orders and shows a banner while the app is open', () => {
    const reaction = reactToPush({ type: 'ORDER_ASSIGNED' }, 'foreground');
    assert.equal(reaction.refreshOrders, true);
    assert.equal(reaction.banner?.title, 'New order');
    assert.equal(reaction.route, null);
  });

  it('opens the orders tab, without a banner, when the notification is tapped', () => {
    const reaction = reactToPush({ type: 'ORDER_READY' }, 'opened');
    assert.equal(reaction.route, '/(tabs)/orders');
    assert.equal(reaction.banner, null);
    assert.equal(reaction.refreshOrders, true);
  });

  it('warns clearly about a customer cancellation, with the order number', () => {
    const banner = reactToPush({ type: 'ORDER_CANCELLED_BY_USER', orderNo: '1042' }, 'foreground').banner;
    assert.equal(banner?.tone, 'cancelled');
    assert.match(banner?.message ?? '', /#1042/);
    assert.match(banner?.message ?? '', /Do not deliver/);
  });

  it('omits the order number when the server did not send one', () => {
    const banner = reactToPush({ type: 'ORDER_UPDATED', orderNo: '' }, 'foreground').banner;
    assert.equal(banner?.message, 'Order was updated.');
  });

  it('reports the decision on a cancel request', () => {
    const banner = reactToPush({ type: 'CANCEL_UPDATE', decision: 'Approved', orderNo: '7' }, 'foreground').banner;
    assert.equal(banner?.message, 'Your request for order #7 was approved.');
  });

  it('sends an attendance reminder to the route tab without reloading orders', () => {
    const reaction = reactToPush({ type: 'ATTENDANCE_REMINDER', mealSlot: 'Lunch' }, 'opened');
    assert.equal(reaction.route, '/(tabs)/route');
    assert.equal(reaction.refreshOrders, false);
    assert.equal(reactToPush({ type: 'ATTENDANCE_REMINDER', mealSlot: 'Lunch' }, 'foreground').banner?.message, 'Time to mark attendance for Lunch.');
  });
});
