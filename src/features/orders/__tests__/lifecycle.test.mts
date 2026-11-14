import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isReadyForPickup, lifecycleOf, lifecycleOfKey, statusKeyOf } from '../lifecycle.ts';

describe('isReadyForPickup', () => {
  it('is true only once the kitchen has marked the order ready', () => {
    assert.equal(isReadyForPickup('readytodelivery'), true);
    assert.equal(isReadyForPickup('readyfordelivery'), true);
    for (const status of ['accepted', 'preparing', 'handedovertodeliveryboy', 'delivered', '']) {
      assert.equal(isReadyForPickup(status), false, status);
    }
  });
});

describe('statusKeyOf / lifecycleOfKey / lifecycleOf', () => {
  it('normalises separators and case, and prefers orderstatus over the other fields', () => {
    assert.equal(statusKeyOf({ orderstatus: 'Ready For_Delivery', status: 'x' }), 'readyfordelivery');
    assert.equal(statusKeyOf({ riderStatus: 'ON-THE-WAY' }), 'ontheway');
    assert.equal(statusKeyOf(null), '');
  });

  it('buckets keys and raw orders the same way', () => {
    assert.equal(lifecycleOfKey('preparing'), 'prePickup');
    assert.equal(lifecycleOfKey('outfordelivery'), 'postPickup');
    assert.equal(lifecycleOfKey('delivered'), 'done');
    assert.equal(lifecycleOfKey('autocancelled'), 'cancelled');
    assert.equal(lifecycleOfKey(''), 'unknown');
    assert.equal(lifecycleOf({ orderstatus: 'accepted' }), 'prePickup');
  });
});
