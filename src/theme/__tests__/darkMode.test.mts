import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { LOGIN_COLORS, LOGIN_COLORS_DARK } from '../../features/auth/login/loginTheme.ts';
import { ONBOARDING_COLORS, ONBOARDING_COLORS_DARK } from '../../features/onboarding/onboardingTheme.ts';
import {
  DETAIL_COLORS,
  DETAIL_COLORS_DARK,
  HOME_COLORS,
  HOME_COLORS_DARK,
  ORDER_PILL,
  ORDER_PILL_DARK,
} from '../../features/orders/home/homeTheme.ts';
import { REGISTER_COLORS, REGISTER_COLORS_DARK } from '../../features/register/ui/registerTheme.ts';
import { contrastRatio, MIN_TEXT_CONTRAST } from '../contrast.ts';
import { colorsIn, darkenSvg, MAP_DARK_MAP, SVG_DARK_MAP, SVG_KEEP } from '../svgDark.ts';
import { palette } from '../palette.ts';

import * as auth from '../../features/auth/login/svgSources.ts';
import * as onboarding from '../../features/onboarding/art/svgSources.ts';
import * as earnings from '../../features/onboarding/art/svgSourcesEarnings.ts';
import * as proof from '../../features/onboarding/art/svgSourcesProof.ts';
import * as detail from '../../features/orders/home/detailSvgSources.ts';
import * as home from '../../features/orders/home/homeSvgSources.ts';
import * as order from '../../features/orders/home/orderSvgSources.ts';
import * as register from '../../features/register/ui/svgSources.ts';
import * as bank from '../../features/register/ui/svgSourcesBank.ts';
import * as docs from '../../features/register/ui/svgSourcesDocs.ts';
import * as route from '../../features/route/ui/routeSvgSources.ts';
import * as shift from '../../features/shift/ui/shiftSvgSources.ts';
import * as cancel from '../../features/trip/ui/cancelSvgSources.ts';

function passes(foreground: string, background: string, minimum = MIN_TEXT_CONTRAST): boolean {
  return contrastRatio(foreground, background) >= minimum;
}

describe('dark palettes mirror their light twins', () => {
  const pairs: [string, object, object][] = [
    ['onboarding', ONBOARDING_COLORS, ONBOARDING_COLORS_DARK],
    ['login', LOGIN_COLORS, LOGIN_COLORS_DARK],
    ['home', HOME_COLORS, HOME_COLORS_DARK],
    ['detail', DETAIL_COLORS, DETAIL_COLORS_DARK],
    ['register', REGISTER_COLORS, REGISTER_COLORS_DARK],
  ];

  for (const [name, light, dark] of pairs) {
    it(`${name} has the same keys in both modes and a real colour for each`, () => {
      assert.deepEqual(Object.keys(dark).sort(), Object.keys(light).sort());
      for (const [key, value] of Object.entries(dark)) {
        assert.match(value as string, /^(#[0-9a-f]{6}|rgba\([^)]+\))$/i, `${name}.${key}`);
      }
    });
  }

  it('order status pills have every tone in both modes', () => {
    assert.deepEqual(Object.keys(ORDER_PILL_DARK).sort(), Object.keys(ORDER_PILL).sort());
  });
});

describe('dark onboarding and login', () => {
  const o = ONBOARDING_COLORS_DARK;
  const l = LOGIN_COLORS_DARK;

  it('keeps onboarding copy and green text readable', () => {
    assert.ok(passes(o.ink, o.sheet));
    assert.ok(passes(o.muted, o.sheet));
    assert.ok(passes(o.ink, o.mint));
    assert.ok(passes(o.greenInk, o.mint));
    assert.ok(passes(o.greenInk, o.canvas));
    assert.ok(passes(o.onGreen, o.green));
  });

  it('keeps login text, links and errors readable', () => {
    assert.ok(passes(l.ink, l.canvas));
    assert.ok(passes(l.muted, l.canvas));
    assert.ok(passes(l.body, l.canvas));
    assert.ok(passes(l.greenInk, l.surface));
    assert.ok(passes(l.greenInk, l.chipBg));
    assert.ok(passes(l.error, l.surface));
    assert.ok(passes(l.onGreen, l.green));
    assert.ok(passes(l.onLime, l.lime));
    assert.ok(passes(l.onHero, l.heroBg));
    assert.ok(passes(l.heroMuted, l.heroBg));
  });
});

describe('dark home, order list and order detail', () => {
  const h = HOME_COLORS_DARK;
  const d = DETAIL_COLORS_DARK;

  it('keeps home text readable on the page and cards', () => {
    assert.ok(passes(h.ink, h.card));
    assert.ok(passes(h.muted, h.card));
    assert.ok(passes(h.muted, h.canvas));
    assert.ok(passes(h.title, h.canvas));
    assert.ok(passes(h.greenInk, h.canvas));
    assert.ok(passes(h.completedInk, h.completedBg));
    assert.ok(passes(h.bannerInk, h.bannerBg));
    assert.ok(passes(h.initialsInk, h.initialsBg));
  });

  it('keeps the selected date tile and the active shift card readable', () => {
    assert.ok(passes(h.onGreen, h.green));
    assert.ok(passes(h.onGreen, h.activeBg));
    assert.ok(passes(h.lime, h.activeBg));
  });

  it('keeps every order status pill readable', () => {
    for (const [tone, pill] of Object.entries(ORDER_PILL_DARK)) {
      assert.ok(passes(pill.ink, pill.bg), tone);
    }
  });

  it('keeps order detail copy, the next-step card and buttons readable', () => {
    assert.ok(passes(d.subtle, h.card));
    assert.ok(passes(d.metaInk, h.card));
    assert.ok(passes(d.tagInk, h.card));
    assert.ok(passes(h.onGreen, d.nextCard));
    assert.ok(passes(h.greenInk, d.tonalButton));
  });
});

describe('dark registration screens', () => {
  const r = REGISTER_COLORS_DARK;

  it('keeps form copy, links, tags and banners readable', () => {
    assert.ok(passes(r.ink, r.card));
    assert.ok(passes(r.body, r.canvas));
    assert.ok(passes(r.muted, r.card));
    assert.ok(passes(r.greenDeep, r.canvas));
    assert.ok(passes(r.greenDeep, r.tile));
    assert.ok(passes(r.greenDeep, r.requiredTagBg));
    assert.ok(passes(r.required, r.canvas));
    assert.ok(passes(r.mintBannerInk, r.mintBannerBg));
    assert.ok(passes(r.success, r.card));
    assert.ok(passes(r.body, r.tagGrey));
    assert.ok(passes(r.muted, r.tagGrey));
    assert.ok(passes(r.onGreen, r.green));
    assert.ok(passes(r.limePillInk, r.limePill));
  });

  it('keeps placeholders visible (3:1, as placeholders are not body text)', () => {
    assert.ok(passes(r.placeholder, r.card, 3));
  });
});

describe('shared dark tokens', () => {
  it('passes AA for body, muted and button text', () => {
    assert.ok(passes(palette.dark.textStrong, palette.dark.card));
    assert.ok(passes(palette.dark.textMuted, palette.dark.card));
    assert.ok(passes(palette.dark.textMuted, palette.dark.background));
    assert.ok(passes(palette.dark.background, palette.brand.light));
    assert.ok(passes(palette.brand.light, palette.dark.card));
  });

  it('passes AA for the light page and primary button too', () => {
    assert.ok(passes(palette.light.textMuted, palette.light.background));
    assert.ok(passes('#ffffff', palette.brand.primary));
  });
});

describe('exported SVG colours in dark mode', () => {
  const modules = { auth, onboarding, earnings, proof, detail, home, order, register, bank, docs, shift, route, cancel };
  const known = new Set([...Object.keys(SVG_DARK_MAP), ...Object.keys(MAP_DARK_MAP), ...SVG_KEEP]);

  it('every colour in every exported SVG is mapped or deliberately kept', () => {
    const missing: string[] = [];
    for (const [moduleName, exports] of Object.entries(modules)) {
      for (const [name, xml] of Object.entries(exports)) {
        for (const color of colorsIn(xml as string)) {
          if (!known.has(color)) missing.push(`${moduleName}.${name}: ${color}`);
        }
      }
    }
    assert.deepEqual(missing, []);
  });

  it('mapped icon colours are visible on the dark card (3:1 for icons)', () => {
    for (const [from, to] of Object.entries(SVG_DARK_MAP)) {
      assert.ok(passes(to, palette.dark.card, 3), `${from} -> ${to}`);
    }
  });

  it('darkenSvg swaps known colours, keeps the lime and leaves the input alone', () => {
    const xml = '<svg><path stroke="#171C19"/><path fill="#B8F52B"/><path stroke="#037F56"/></svg>';
    const dark = darkenSvg(xml);
    assert.ok(dark.includes('#eef3ef'));
    assert.ok(dark.includes('#B8F52B'));
    assert.ok(!dark.includes('#171C19'));
    assert.ok(xml.includes('#171C19'));
  });

  it('turns white road strokes into a dark line only for map layers', () => {
    const xml = '<svg><path stroke="white" fill="white"/></svg>';
    assert.equal(darkenSvg(xml), xml);
    assert.ok(!darkenSvg(xml, { roads: true }).includes('white'));
  });
});
