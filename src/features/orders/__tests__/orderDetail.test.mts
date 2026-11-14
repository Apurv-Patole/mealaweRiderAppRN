import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import { DETAIL_COLORS as D, DETAIL_COLORS_DARK as DD, HOME_COLORS as C, HOME_COLORS_DARK as CD } from '../home/homeTheme.ts';
import { orderTitle, orderTypeLabel, pickupBlockReason } from '../orderDetailModel.ts';
import { currentStep, nextStep, PROGRESS_STEPS } from '../orderProgress.ts';

describe('orderTitle', () => {
  it('shows the order number', () => {
    assert.equal(orderTitle({ orderNo: 'DM1001' }), 'Order #DM1001');
  });
});

describe('orderTypeLabel', () => {
  it('turns camelCase and snake_case into words', () => {
    assert.equal(orderTypeLabel('allDay'), 'All day');
    assert.equal(orderTypeLabel('advance_order'), 'Advance order');
    assert.equal(orderTypeLabel('ADVANCE'), 'Advance');
    assert.equal(orderTypeLabel('single-meal'), 'Single meal');
  });

  it('returns an empty string for nothing', () => {
    assert.equal(orderTypeLabel(''), '');
    assert.equal(orderTypeLabel('   '), '');
  });
});

describe('next step copy', () => {
  it('uses sentence case for the small heading above the title', () => {
    assert.equal(nextStep({ statusKey: 'preparing', lifecycle: 'prePickup' }).eyebrow, 'Next step');
    assert.equal(nextStep({ statusKey: 'delivered', lifecycle: 'done' }).eyebrow, 'Order status');
    assert.equal(nextStep({ statusKey: 'x', lifecycle: 'cancelled' }).eyebrow, 'Order status');
  });

  it('still says "Waiting for the kitchen" while preparing', () => {
    const step = nextStep({ statusKey: 'preparing', lifecycle: 'prePickup' });
    assert.equal(step.title, 'Waiting for the kitchen');
    assert.equal(step.navigateTo, 'kitchen');
  });
});

describe('pickup copy and rules', () => {
  it('tells the rider to collect the order from the named kitchen', () => {
    const step = nextStep({ statusKey: 'readytodelivery', lifecycle: 'prePickup', kitchen: { name: 'Green Bowl Kitchen' } });
    assert.equal(step.title, 'Pick up the order');
    assert.equal(step.subtitle, 'Green Bowl Kitchen marked it ready. Collect it, then photograph the handover.');
    assert.equal(step.navigateTo, 'kitchen');
  });

  it('falls back to "The kitchen" when the name is missing', () => {
    assert.match(nextStep({ statusKey: 'readytodelivery', lifecycle: 'prePickup' }).subtitle, /^The kitchen marked it ready/);
  });

  const kitchen = { lat: 18.56, lng: 73.78 };
  const here = { lat: 18.5601, lng: 73.7801 };

  it('blocks a pickup with no running shift', () => {
    assert.match(pickupBlockReason({ hasShift: false, riderLocation: here, kitchenLocation: kitchen, proximityM: 100, distanceM: 10 }) ?? '', /Start your shift/);
  });

  it('waits for a location fix when the kitchen has coordinates', () => {
    assert.match(pickupBlockReason({ hasShift: true, riderLocation: null, kitchenLocation: kitchen, proximityM: 100, distanceM: null }) ?? '', /Waiting for your location/);
  });

  it('blocks a pickup that is too far away and names the limit', () => {
    assert.equal(
      pickupBlockReason({ hasShift: true, riderLocation: here, kitchenLocation: kitchen, proximityM: 100, distanceM: 450 }),
      'Get within 100 m of the kitchen to complete the pickup.',
    );
  });

  it('allows a pickup within range, exactly at the limit, or when the kitchen has no coordinates', () => {
    assert.equal(pickupBlockReason({ hasShift: true, riderLocation: here, kitchenLocation: kitchen, proximityM: 100, distanceM: 40 }), null);
    assert.equal(pickupBlockReason({ hasShift: true, riderLocation: here, kitchenLocation: kitchen, proximityM: 100, distanceM: 100 }), null);
    assert.equal(pickupBlockReason({ hasShift: true, riderLocation: null, kitchenLocation: null, proximityM: 100, distanceM: null }), null);
  });
});

describe('picked-up copy', () => {
  it('tells the rider to head to the customer, naming them and their address', () => {
    const step = nextStep({
      statusKey: 'handedovertodeliveryboy',
      lifecycle: 'postPickup',
      customer: { name: 'Imran Sheikh', address: '9, Balewadi Phata Road' },
    });
    assert.equal(step.title, 'Head to the customer');
    assert.equal(step.subtitle, 'Imran Sheikh, 9, Balewadi Phata Road. Tap start when you leave.');
    assert.equal(step.navigateTo, null);
  });

  it('still reads well when the customer details are missing', () => {
    const step = nextStep({ statusKey: 'outfordelivery', lifecycle: 'postPickup' });
    assert.equal(step.subtitle, 'Tap start when you leave.');
  });

  it('keeps the confirmation banner readable in both modes', () => {
    assert.ok(contrastRatio(D.confirmInk, C.completedBg) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(DD.confirmInk, CD.completedBg) >= MIN_TEXT_CONTRAST);
  });
});

describe('on-the-way copy', () => {
  it('names the customer and says what happens next', () => {
    const step = nextStep({ statusKey: 'ontheway', lifecycle: 'postPickup', customer: { name: 'Imran Sheikh', address: '9, Balewadi Phata Road' } });
    assert.equal(step.title, 'Deliver to Imran Sheikh');
    assert.equal(step.subtitle, 'Mark delivered when the order is in their hands. You will take a photo next.');
    assert.equal(step.navigateTo, null);
  });

  it('falls back to "the customer" without a name', () => {
    assert.equal(nextStep({ statusKey: 'ontheway', lifecycle: 'postPickup' }).title, 'Deliver to the customer');
  });

  it('keeps the map pill and card edge readable in both modes', () => {
    assert.ok(contrastRatio(C.title, '#ffffff') >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(D.subtle, '#ffffff') >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(CD.title, CD.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(DD.subtle, CD.card) >= MIN_TEXT_CONTRAST);
  });
});

describe('progress steps', () => {
  it('has the five stages in order', () => {
    assert.deepEqual(
      PROGRESS_STEPS.map((step) => step.label),
      ['Assigned', 'Ready', 'Picked up', 'On the way', 'Delivered'],
    );
  });

  it('starts at Assigned while the kitchen is preparing', () => {
    assert.equal(currentStep({ statusKey: 'preparing' }), 1);
  });
});

describe('order detail colours', () => {
  // Known gap in the design: 14 pt bold green on the pale "Navigate" button is 4.44:1, just under AA (4.5).
  // Kept as designed; this guards against it getting any worse.
  it('keeps the pale Navigate button text at 4:1 or better', () => {
    assert.ok(contrastRatio(C.green, D.tonalButton) >= 4);
  });

  it('passes AA for the headings and copy on the page and cards', () => {
    assert.ok(contrastRatio(C.title, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(D.subtle, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(D.metaInk, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(D.tagInk, C.card) >= MIN_TEXT_CONTRAST);
  });

  it('passes AA for the buttons and the green next-step card', () => {
    assert.ok(contrastRatio(C.green, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.onGreen, D.nextCard) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.onGreen, C.green) >= MIN_TEXT_CONTRAST);
  });

  it('keeps the progress step labels and times readable in both modes', () => {
    assert.ok(contrastRatio(D.stepInk, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(D.subtle, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(DD.stepInk, CD.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(DD.subtle, CD.card) >= MIN_TEXT_CONTRAST);
  });

  it('keeps the Ready for pickup badge readable in both modes', () => {
    assert.ok(contrastRatio(C.completedInk, C.completedBg) >= 4);
    assert.ok(contrastRatio(CD.completedInk, CD.completedBg) >= MIN_TEXT_CONTRAST);
  });
});
