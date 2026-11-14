import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { deliveredAtIso, nextStopLine, nextStopOf } from '../deliveredModel.ts';

const stop = (type: 'kitchen' | 'customer', orders: number, km: number | null) =>
  ({ type, orders: new Array(orders).fill({}), distanceFromRiderKm: km }) as never;

describe('delivered screen model', () => {
  it('picks the first stop, or null when none is left', () => {
    const stops = [stop('customer', 1, 1), stop('customer', 1, 2)];
    assert.equal(nextStopOf(stops), stops[0]);
    assert.equal(nextStopOf([]), null);
  });

  it('describes the next stop', () => {
    assert.equal(nextStopLine(stop('customer', 1, 5.31)), 'Deliver · 1 order · 5.3 km');
    assert.equal(nextStopLine(stop('kitchen', 2, null)), 'Pick up · 2 orders');
  });

  it('reads the confirm time from the route parameter', () => {
    assert.equal(deliveredAtIso('1700000000000'), new Date(1700000000000).toISOString());
    assert.equal(deliveredAtIso(undefined), null);
    assert.equal(deliveredAtIso('abc'), null);
    assert.equal(deliveredAtIso('0'), null);
  });
});
