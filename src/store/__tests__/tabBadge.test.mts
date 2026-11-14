import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { badgeText, useTabBadgeStore } from '../tabBadgeStore.ts';

describe('badgeText', () => {
  it('shows nothing at zero or below', () => {
    assert.equal(badgeText(0), '');
    assert.equal(badgeText(-3), '');
  });

  it('shows the count up to 99 and 99+ above', () => {
    assert.equal(badgeText(1), '1');
    assert.equal(badgeText(99), '99');
    assert.equal(badgeText(100), '99+');
    assert.equal(badgeText(1000), '99+');
  });
});

describe('useTabBadgeStore', () => {
  beforeEach(() => useTabBadgeStore.setState({ ordersCount: 0 }));

  it('stores a whole, non-negative orders count', () => {
    useTabBadgeStore.getState().setOrdersCount(4);
    assert.equal(useTabBadgeStore.getState().ordersCount, 4);
    useTabBadgeStore.getState().setOrdersCount(-2);
    assert.equal(useTabBadgeStore.getState().ordersCount, 0);
    useTabBadgeStore.getState().setOrdersCount(2.9);
    assert.equal(useTabBadgeStore.getState().ordersCount, 2);
  });
});
