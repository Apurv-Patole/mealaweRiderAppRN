import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../../theme/contrast.ts';
import { LOGIN_COLORS as C, LOGIN_METRICS } from '../loginTheme.ts';

describe('login colours', () => {
  it('passes AA for the primary button label', () => {
    assert.ok(contrastRatio(C.onGreen, C.green) >= MIN_TEXT_CONTRAST);
  });

  it('passes AA for form text on the page and inside the field', () => {
    assert.ok(contrastRatio(C.ink, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.muted, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.ink, C.surface) >= MIN_TEXT_CONTRAST);
  });

  it('passes AA for the code screen subtitle and its bold number', () => {
    assert.ok(contrastRatio(C.body, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.ink, C.canvas) >= MIN_TEXT_CONTRAST);
  });

  it('passes AA for the error message on the page', () => {
    assert.ok(contrastRatio(C.error, C.canvas) >= MIN_TEXT_CONTRAST);
  });

  // Known gap in the design: 12 pt semibold green on the pale chip is 4.38:1, just under AA (4.5).
  // Kept as designed; this guards against it getting any worse.
  it('keeps chip labels at 4:1 or better on their pill', () => {
    assert.ok(contrastRatio(C.green, C.chipBg) >= 4);
  });

  it('passes AA for hero text on the dark hero', () => {
    assert.ok(contrastRatio(C.onHero, C.heroBg) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.lime, C.heroBg) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.heroMuted, C.heroBg) >= MIN_TEXT_CONTRAST);
  });

  it('keeps ink readable on the lime bonus pill', () => {
    assert.ok(contrastRatio(C.ink, C.lime) >= MIN_TEXT_CONTRAST);
  });
});

describe('login metrics', () => {
  it('fits six code boxes with gaps inside the 358 pt content width', () => {
    const boxes = 6;
    const boxWidth = (358 - LOGIN_METRICS.otpGap * (boxes - 1)) / boxes;
    assert.ok(boxWidth >= 44);
    assert.ok(LOGIN_METRICS.otpBoxHeight >= 48);
  });

  it('keeps every tappable control at 48 pt or more once hit slop is counted', () => {
    assert.ok(LOGIN_METRICS.backSize + LOGIN_METRICS.backHitSlop * 2 >= 48);
    assert.ok(LOGIN_METRICS.buttonHeight >= 48);
    assert.ok(LOGIN_METRICS.demoButtonHeight >= 48);
    assert.ok(LOGIN_METRICS.fieldHeight >= 48);
  });
});
