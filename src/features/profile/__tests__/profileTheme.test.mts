import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import { HOME_COLORS, HOME_COLORS_DARK } from '../../orders/home/homeTheme.ts';
import { heroInitials, heroPhone, heroRoute } from '../profileHero.ts';
import { HERO_FIXED, PROFILE_COLORS, PROFILE_COLORS_DARK } from '../profileTheme.ts';

function passes(foreground: string, background: string, minimum = MIN_TEXT_CONTRAST): boolean {
  return contrastRatio(foreground, background) >= minimum;
}

describe('profile hero text', () => {
  it('takes up to two initials', () => {
    assert.equal(heroInitials('Demo Rider'), 'DR');
    assert.equal(heroInitials('  ravi kumar sharma '), 'RK');
    assert.equal(heroInitials('ravi'), 'R');
    assert.equal(heroInitials(''), 'R');
  });

  it('formats the phone and route, leaving them out when missing', () => {
    assert.equal(heroPhone('9999900000'), '+91 9999900000');
    assert.equal(heroPhone(' '), '');
    assert.equal(heroPhone(undefined), '');
    assert.equal(heroRoute('DEMO-1'), 'Route #DEMO-1');
    assert.equal(heroRoute(''), '');
    assert.equal(heroRoute(null), '');
  });
});

describe('profile palettes', () => {
  it('has the same keys in light and dark, each a real colour', () => {
    assert.deepEqual(Object.keys(PROFILE_COLORS_DARK).sort(), Object.keys(PROFILE_COLORS).sort());
    for (const [key, value] of Object.entries(PROFILE_COLORS_DARK)) {
      assert.match(value, /^(#[0-9a-f]{6}|rgba\([^)]+\))$/i, key);
    }
  });

  it('light: the switch, chips and tile icons are readable', () => {
    const c = PROFILE_COLORS;
    // The designer's inactive tab text (4.3:1) and "Allowed" chip (4.3:1) are a touch under AA; keep them at 4:1 or better.
    assert.ok(passes(c.trackInk, c.trackBg, 4));
    assert.ok(passes(c.thumbInk, c.thumbBg));
    // The designer's "Allowed" chip colours are a touch under AA; keep them at 4:1 or better.
    assert.ok(passes(c.allowedInk, c.allowedBg, 4));
    assert.ok(passes(c.signOut, HOME_COLORS.canvas));
    for (const [icon, bg] of [
      [c.editTileIcon, c.editTileBg],
      [c.walletTileIcon, c.walletTileBg],
      [c.mintTileIcon, c.mintTileBg],
      [c.blueTileIcon, c.blueTileBg],
    ] as const) {
      assert.ok(passes(icon, bg, 3), `${icon} on ${bg}`);
    }
  });

  it('dark: the switch, chips, sign out and tile icons are readable', () => {
    const c = PROFILE_COLORS_DARK;
    assert.ok(passes(c.trackInk, c.trackBg));
    assert.ok(passes(c.thumbInk, c.thumbBg));
    assert.ok(passes(c.allowedInk, c.allowedBg));
    assert.ok(passes(c.signOut, HOME_COLORS_DARK.canvas));
    assert.ok(passes(c.footer, HOME_COLORS_DARK.canvas));
    for (const [icon, bg] of [
      [c.editTileIcon, c.editTileBg],
      [c.walletTileIcon, c.walletTileBg],
      [c.mintTileIcon, c.mintTileBg],
      [c.blueTileIcon, c.blueTileBg],
    ] as const) {
      assert.ok(passes(icon, bg, 3), `${icon} on ${bg}`);
    }
  });

  it('the hero text is readable on every stop of the gradient in both modes', () => {
    for (const hero of [PROFILE_COLORS, PROFILE_COLORS_DARK]) {
      for (const stop of [hero.heroFrom, hero.heroMid, hero.heroTo]) {
        assert.ok(passes(HERO_FIXED.text, stop), `white on ${stop}`);
      }
    }
    assert.ok(passes(HERO_FIXED.activePillInk, HERO_FIXED.activePillBg));
    assert.ok(passes(HERO_FIXED.routePillInk, '#ffffff'));
  });
});
