import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import {
  CAPSULE,
  COIN,
  COIN_LOWER,
  COIN_UPPER,
  DIAL,
  EARNINGS_BARS,
  EARNINGS_CARD,
  EARNINGS_RINGS,
  FRAME,
  HERO_HEIGHT,
  MAP_PLACEMENT,
  PROOF_LIVE,
  PROOF_MAP,
  PROOF_PHOTO,
  PROOF_PICKUP,
  PROOF_PIN,
  PROOF_PIN_DOT,
  PROOF_RIDER,
  SHEET_HEIGHT,
  heroOffsetX,
  heroScale,
} from '../art/heroLayout.ts';
import { ONBOARDING_COLORS as C } from '../onboardingTheme.ts';
import { ONBOARDING_SLIDES } from '../slides.ts';

describe('hero geometry', () => {
  it('splits the 844 pt frame into hero and sheet', () => {
    assert.equal(HERO_HEIGHT + SHEET_HEIGHT, FRAME.height);
    assert.equal(HERO_HEIGHT, 520);
  });

  it('renders 1:1 on the design frame and never scales up', () => {
    assert.equal(heroScale(390, 520), 1);
    assert.equal(heroScale(430, 700), 1);
  });

  it('shrinks to fit narrow or short screens but stops at the floor', () => {
    assert.ok(heroScale(360, 520) < 1);
    assert.equal(heroScale(200, 100), 0.78);
  });

  it('centres the frame horizontally', () => {
    assert.equal(heroOffsetX(390, 1), 0);
    assert.equal(heroOffsetX(430, 1), 20);
  });

  it('keeps the dial inside the hero and clear of the sheet', () => {
    assert.ok(DIAL.top + DIAL.size < HERO_HEIGHT);
    assert.ok(DIAL.left + DIAL.size <= FRAME.width);
    assert.equal(DIAL.face, DIAL.size - DIAL.ring * 2);
  });

  it('gives every map asset a positive size', () => {
    for (const rect of Object.values(MAP_PLACEMENT)) {
      assert.ok(rect.width > 0 && rect.height > 0);
    }
  });
});

describe('proof slide geometry', () => {
  it('gives every map layer a positive size', () => {
    for (const rect of Object.values(PROOF_MAP)) {
      assert.ok(rect.width > 0 && rect.height > 0);
    }
  });

  it('keeps every marker inside the hero, above the sheet', () => {
    assert.ok(PROOF_PHOTO.top + PROOF_PHOTO.height < HERO_HEIGHT);
    assert.ok(PROOF_PICKUP.top + PROOF_PICKUP.size < HERO_HEIGHT);
    assert.ok(PROOF_RIDER.top + PROOF_RIDER.halo < HERO_HEIGHT);
    assert.ok(PROOF_PIN.left + PROOF_PIN.width <= FRAME.width);
    assert.ok(PROOF_LIVE.gapAboveSheet > 0);
  });

  it('centres the pin dot in the pin head', () => {
    assert.equal(PROOF_PIN_DOT.offset * 2 + PROOF_PIN_DOT.size, PROOF_PIN.width - 0);
  });
});

describe('earnings slide geometry', () => {
  it('centres the three rings on the wallet card', () => {
    const cardCentre = EARNINGS_CARD.left + EARNINGS_CARD.width / 2;
    for (const ring of Object.values(EARNINGS_RINGS)) {
      assert.ok(Math.abs(ring.left + ring.width / 2 - cardCentre) <= 1);
    }
  });

  it('nests the rings from inner to outer', () => {
    assert.ok(EARNINGS_RINGS.inner.width < EARNINGS_RINGS.middle.width);
    assert.ok(EARNINGS_RINGS.middle.width < EARNINGS_RINGS.outer.width);
  });

  it('fits the chart bars inside the chart, with the peak last', () => {
    assert.equal(EARNINGS_BARS.length, 6);
    assert.equal(Math.max(...EARNINGS_BARS), EARNINGS_BARS[EARNINGS_BARS.length - 1]);
    assert.ok(Math.max(...EARNINGS_BARS) <= EARNINGS_CARD.chartHeight);
  });

  it('keeps coins and the capsule inside the hero', () => {
    assert.ok(COIN_UPPER.top + COIN.size < EARNINGS_CARD.top + EARNINGS_CARD.chartHeight);
    assert.ok(COIN_LOWER.gapAboveSheet > 0);
    assert.ok(CAPSULE.top < HERO_HEIGHT);
  });
});

describe('onboarding colours', () => {
  it('passes AA for the CTA label, copy and heading', () => {
    assert.ok(contrastRatio(C.onGreen, C.green) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.muted, C.sheet) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.ink, C.sheet) >= MIN_TEXT_CONTRAST);
  });

  it('keeps pill labels readable on the mint map', () => {
    assert.ok(contrastRatio(C.ink, C.mint) >= MIN_TEXT_CONTRAST);
  });

  it('keeps the proof badges readable', () => {
    assert.ok(contrastRatio(C.green, C.proofBadge) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.ink, C.liveBadgeGlass.startsWith('rgba') ? '#ffffff' : C.liveBadgeGlass) >= MIN_TEXT_CONTRAST);
  });

  it('keeps the Skip link and ink readable on the slide 3 background', () => {
    assert.ok(contrastRatio(C.ink, C.earningsBg) >= MIN_TEXT_CONTRAST);
  });

  it('reports the Skip link contrast on the mint map (design value, large-ish bold text)', () => {
    assert.ok(contrastRatio(C.green, C.mint) >= 3);
  });
});

describe('slides', () => {
  it('has three slides with unique ids and copy', () => {
    assert.equal(ONBOARDING_SLIDES.length, 3);
    assert.equal(new Set(ONBOARDING_SLIDES.map((s) => s.id)).size, 3);
    for (const slide of ONBOARDING_SLIDES) {
      assert.ok(slide.title.length > 0 && slide.body.length > 0);
    }
  });
});
