import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import { HOME_COLORS, HOME_COLORS_DARK } from '../../orders/home/homeTheme.ts';
import { SHIFT_COLORS, SHIFT_COLORS_DARK } from '../shiftTheme.ts';

function passes(foreground: string, background: string, minimum = MIN_TEXT_CONTRAST): boolean {
  return contrastRatio(foreground, background) >= minimum;
}

describe('route tab palettes', () => {
  it('has the same keys in light and dark, each a real colour', () => {
    assert.deepEqual(Object.keys(SHIFT_COLORS_DARK).sort(), Object.keys(SHIFT_COLORS).sort());
    for (const [key, value] of Object.entries(SHIFT_COLORS_DARK)) {
      assert.match(value, /^(#[0-9a-f]{6}|rgba\([^)]+\))$/i, key);
    }
  });

  it('light: slot pills, the instruction box and the open pill pass AA', () => {
    const c = SHIFT_COLORS;
    assert.ok(passes(c.missedInk, c.missedBg));
    assert.ok(passes(c.openInk, c.openBg));
    assert.ok(passes(c.upcomingInk, c.upcomingBg));
    assert.ok(passes(c.noteInk, c.noteBg));
    assert.ok(passes(c.pillInk, c.pillOpenBg));
    assert.ok(passes(c.pillInk, HOME_COLORS.card));
    assert.ok(passes(c.soft, HOME_COLORS.card));
  });

  it('dark: slot pills, the instruction box and the open pill pass AA', () => {
    const c = SHIFT_COLORS_DARK;
    assert.ok(passes(c.missedInk, c.missedBg));
    assert.ok(passes(c.openInk, c.openBg));
    assert.ok(passes(c.upcomingInk, c.upcomingBg));
    assert.ok(passes(c.noteInk, c.noteBg));
    assert.ok(passes(c.pillInk, c.pillOpenBg));
    assert.ok(passes(c.pillInk, HOME_COLORS_DARK.card));
    assert.ok(passes(c.soft, HOME_COLORS_DARK.card));
  });

  it('keeps the "Worked" pill readable in both modes', () => {
    assert.ok(passes(HOME_COLORS.completedInk, HOME_COLORS.completedBg, 4));
    assert.ok(passes(HOME_COLORS_DARK.completedInk, HOME_COLORS_DARK.completedBg));
  });

  it('light: the online card alert, End shift button, order chips and badges pass AA', () => {
    const c = SHIFT_COLORS;
    assert.ok(passes(c.alertInk, c.alertBg));
    assert.ok(passes(c.endShiftInk, c.endShiftBg));
    assert.ok(passes(c.chipInk, c.chipBg));
    assert.ok(passes(c.hereInk, c.hereBg));
    assert.ok(passes(c.badgeInk, HOME_COLORS.card));
    assert.ok(passes(c.label, HOME_COLORS.card));
    assert.ok(passes(HOME_COLORS.onGreen, c.nextTile));
  });

  it('dark: the online card alert, End shift button, order chips and badges pass AA', () => {
    const c = SHIFT_COLORS_DARK;
    assert.ok(passes(c.alertInk, c.alertBg));
    assert.ok(passes(c.endShiftInk, c.endShiftBg));
    assert.ok(passes(c.chipInk, c.chipBg));
    assert.ok(passes(c.hereInk, c.hereBg));
    assert.ok(passes(c.badgeInk, HOME_COLORS_DARK.card));
    assert.ok(passes(c.label, HOME_COLORS_DARK.card));
    assert.ok(passes(HOME_COLORS_DARK.onGreen, c.nextTile));
  });
});
