import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { deliverySummaryLine, photoCaption, shortPlace } from '../deliverCopy.ts';

describe('delivery photo copy', () => {
  it('prefers the landmark for the place', () => {
    assert.equal(shortPlace({ address: '9, Balewadi Phata Road', landmark: 'Balewadi Phata' }), 'Balewadi Phata');
  });

  it('falls back to the address and cuts a long one at a word', () => {
    assert.equal(shortPlace({ address: 'Flat 12, Sunrise Heights, Baner Road, Pune', landmark: '' }), 'Flat 12, Sunrise…');
    assert.equal(shortPlace({ address: '', landmark: '' }), '');
  });

  it('builds the chip with the time first', () => {
    assert.equal(photoCaption('2:58 PM', { address: '', landmark: 'Balewadi Phata' }), '2:58 PM · Balewadi Phata');
    assert.equal(photoCaption('2:58 PM', { address: '', landmark: '' }), '2:58 PM');
  });

  it('builds the summary line, with or without an address', () => {
    assert.equal(deliverySummaryLine('DM1004', '9, Balewadi Phata Road'), 'Order #DM1004 · 9, Balewadi Phata Road');
    assert.equal(deliverySummaryLine('DM1004', '  '), 'Order #DM1004');
  });
});
