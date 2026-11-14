import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { routeSummaryText, stopSubtitle } from '../routeText.ts';

describe('routeSummaryText', () => {
  it('joins collect, deliver and distance with bullets', () => {
    assert.equal(routeSummaryText(5, 5, '21.9 km'), '5 to collect • 5 to deliver • about 21.9 km');
  });

  it('leaves out anything that is zero or unknown', () => {
    assert.equal(routeSummaryText(0, 3, null), '3 to deliver');
    assert.equal(routeSummaryText(2, 0, '800 m'), '2 to collect • about 800 m');
    assert.equal(routeSummaryText(0, 0, null), '');
  });
});

describe('stopSubtitle', () => {
  it('describes a pickup with orders and distance', () => {
    assert.equal(stopSubtitle('kitchen', 2, '1.7 km'), 'Pick up • 2 orders • 1.7 km');
  });

  it('describes a delivery and uses the singular for one order', () => {
    assert.equal(stopSubtitle('customer', 1, '2.5 km'), 'Deliver • 1 order • 2.5 km');
  });

  it('drops the distance when it is not known', () => {
    assert.equal(stopSubtitle('customer', 1, null), 'Deliver • 1 order');
  });
});
