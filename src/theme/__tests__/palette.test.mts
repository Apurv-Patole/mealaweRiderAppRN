import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../contrast.ts';
import { palette } from '../palette.ts';
import { getStatusColors, STATUS_TONES } from '../statusColors.ts';
import { darkColors, lightColors } from '../theme.ts';

const WHITE = '#ffffff';

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for identical colors', () => {
    assert.equal(Math.round(contrastRatio('#000000', WHITE)), 21);
    assert.equal(contrastRatio('#336699', '#336699'), 1);
  });

  it('is symmetric', () => {
    assert.equal(contrastRatio('#39721e', WHITE), contrastRatio(WHITE, '#39721e'));
  });
});

describe('light theme', () => {
  it('passes AA for primary button text', () => {
    assert.ok(contrastRatio(lightColors.primaryForeground, lightColors.primary) >= MIN_TEXT_CONTRAST);
  });

  it('passes AA for body and muted text on cards and the page', () => {
    assert.ok(contrastRatio(lightColors.foreground, lightColors.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(lightColors.mutedForeground, lightColors.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(lightColors.mutedForeground, lightColors.background) >= MIN_TEXT_CONTRAST);
  });

  it('passes AA for danger text on cards', () => {
    assert.ok(contrastRatio(lightColors.danger, lightColors.card) >= MIN_TEXT_CONTRAST);
  });

  it('documents that the bright brand green must not be used as text on white', () => {
    assert.ok(contrastRatio(palette.brand.light, WHITE) < MIN_TEXT_CONTRAST);
  });
});

describe('dark theme', () => {
  it('passes AA for primary button text and body text', () => {
    assert.ok(contrastRatio(darkColors.primaryForeground, darkColors.primary) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(darkColors.foreground, darkColors.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(darkColors.mutedForeground, darkColors.card) >= MIN_TEXT_CONTRAST);
  });
});

describe('status colors', () => {
  it('defines every tone for both schemes', () => {
    for (const tone of STATUS_TONES) {
      for (const scheme of ['light', 'dark'] as const) {
        const colors = getStatusColors(tone, scheme);
        assert.match(colors.fill, /^#[0-9a-f]{6}$/);
        assert.match(colors.ink, /^#[0-9a-f]{6}$/);
        assert.match(colors.soft, /^#[0-9a-f]{6}$/);
      }
    }
  });

  it('light ink passes AA on white and on its own soft background', () => {
    for (const tone of STATUS_TONES) {
      const { ink, soft } = getStatusColors(tone, 'light');
      assert.ok(contrastRatio(ink, WHITE) >= MIN_TEXT_CONTRAST, `${tone} ink on white`);
      assert.ok(contrastRatio(ink, soft) >= MIN_TEXT_CONTRAST, `${tone} ink on soft`);
    }
  });

  it('dark ink passes AA on the dark card and on its own soft background', () => {
    for (const tone of STATUS_TONES) {
      const { ink, soft } = getStatusColors(tone, 'dark');
      assert.ok(contrastRatio(ink, palette.dark.card) >= MIN_TEXT_CONTRAST, `${tone} ink on card`);
      assert.ok(contrastRatio(ink, soft) >= MIN_TEXT_CONTRAST, `${tone} ink on soft`);
    }
  });

  it('keeps the original rider status fills (assigned, in progress, delivered, cancelled)', () => {
    assert.equal(getStatusColors('assigned', 'light').fill, '#3b82f6');
    assert.equal(getStatusColors('ready', 'light').fill, '#f59e0b');
    assert.equal(getStatusColors('done', 'light').fill, '#63ab45');
    assert.equal(getStatusColors('cancelled', 'light').fill, '#ef4444');
  });
});
