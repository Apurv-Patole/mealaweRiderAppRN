import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import { HOME_COLORS as C, ORDER_PILL } from '../home/homeTheme.ts';
import { tintSvg } from '../home/svgTint.ts';
import { formatRupees, statusLabel, statusTone } from '../orderModel.ts';

describe('tintSvg', () => {
  const xml = '<svg><path fill="#2B64B1"/><path stroke="#2b64b1"/><path fill="#ffffff"/></svg>';

  it('replaces every match, ignoring case', () => {
    assert.equal(tintSvg(xml, '#2b64b1', '#b45309'), '<svg><path fill="#b45309"/><path stroke="#b45309"/><path fill="#ffffff"/></svg>');
  });

  it('leaves the svg alone when the colour is absent', () => {
    assert.equal(tintSvg(xml, '#123456', '#000000'), xml);
  });

  it('treats the colour as plain text, not a pattern', () => {
    assert.equal(tintSvg('a.b a-b', 'a.b', 'X'), 'X a-b');
  });
});

describe('order status pills', () => {
  it('passes AA for every tone', () => {
    for (const [tone, pill] of Object.entries(ORDER_PILL)) {
      assert.ok(contrastRatio(pill.ink, pill.bg) >= MIN_TEXT_CONTRAST, tone);
    }
  });

  it('gives Preparing and Accepted the design blue', () => {
    const preparing = { statusKey: 'preparing', lifecycle: 'prePickup' } as const;
    assert.equal(statusTone(preparing), 'assigned');
    assert.equal(statusLabel(preparing), 'Preparing');
    assert.equal(ORDER_PILL.assigned.bg, '#ebf4fe');
    assert.equal(ORDER_PILL.assigned.ink, '#2b64b1');
  });

  it('has a pill colour for every status tone the model can return', () => {
    const samples = [
      { statusKey: 'preparing', lifecycle: 'prePickup' },
      { statusKey: 'readytodelivery', lifecycle: 'prePickup' },
      { statusKey: 'ontheway', lifecycle: 'postPickup' },
      { statusKey: 'delivered', lifecycle: 'done' },
      { statusKey: 'cancelled', lifecycle: 'cancelled' },
      { statusKey: 'mystery', lifecycle: 'unknown' },
    ] as const;
    for (const sample of samples) assert.ok(ORDER_PILL[statusTone(sample)], sample.statusKey);
  });
});

describe('order card text', () => {
  it('passes AA for the card copy on white', () => {
    assert.ok(contrastRatio(C.ink, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.muted, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.title, C.canvas) >= MIN_TEXT_CONTRAST);
  });

  it('formats rupees with Indian grouping', () => {
    assert.equal(formatRupees(165), '₹165');
    assert.equal(formatRupees(125000), '₹1,25,000');
  });
});
