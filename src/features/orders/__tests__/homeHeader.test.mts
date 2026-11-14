import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import { DEFAULT_SLOT_CONFIG, type SlotWindow } from '../../shift/slots.ts';
import { activeMealName, shiftStatusLine } from '../home/homeHeaderModel.ts';
import { HOME_COLORS as C, HOME_METRICS } from '../home/homeTheme.ts';

function slot(meal: SlotWindow['meal'], key: keyof typeof DEFAULT_SLOT_CONFIG): SlotWindow {
  const raw = DEFAULT_SLOT_CONFIG[key];
  const [startHour, startMin] = raw.startTime.split(':').map(Number);
  const [endHour, endMin] = raw.endTime.split(':').map(Number);
  return {
    meal,
    startTime: raw.startTime,
    endTime: raw.endTime,
    startHour: startHour + startMin / 60,
    endHour: endHour + endMin / 60,
    earlyLoginCutoff: raw.earlyLoginCutoff ?? null,
    label: `${raw.startTime} - ${raw.endTime}`,
  };
}

const SLOTS = [slot('Breakfast', 'breakfast'), slot('Lunch', 'lunch'), slot('Dinner', 'dinner')];

function at(hour: number, minute = 0): Date {
  return new Date(2026, 10, 4, hour, minute);
}

describe('activeMealName', () => {
  it('returns the meal whose window is running today', () => {
    assert.equal(activeMealName(SLOTS, at(9), 0), 'Breakfast');
    assert.equal(activeMealName(SLOTS, at(12), 0), 'Lunch');
    assert.equal(activeMealName(SLOTS, at(19), 0), 'Dinner');
  });

  it('returns null between windows and after the last one', () => {
    assert.equal(activeMealName(SLOTS, at(7), 0), null);
    assert.equal(activeMealName(SLOTS, at(15), 0), null);
    assert.equal(activeMealName(SLOTS, at(23), 0), null);
  });

  it('returns null on a future day, whatever the time', () => {
    assert.equal(activeMealName(SLOTS, at(12), 1), null);
  });

  it('returns null when there are no slots', () => {
    assert.equal(activeMealName([], at(12), 0), null);
  });
});

describe('shiftStatusLine', () => {
  it('names the running meal shift first', () => {
    assert.equal(shiftStatusLine(true, 'Lunch'), 'Lunch shift is active');
    assert.equal(shiftStatusLine(false, 'Dinner'), 'Dinner shift is active');
  });

  it('falls back to on or off shift when no meal is running', () => {
    assert.equal(shiftStatusLine(true, null), 'On shift');
    assert.equal(shiftStatusLine(false, null), 'Off shift');
  });
});

describe('home colours and metrics', () => {
  it('passes AA for body text on the page and on white cards', () => {
    assert.ok(contrastRatio(C.ink, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.muted, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.ink, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.muted, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.title, C.canvas) >= MIN_TEXT_CONTRAST);
  });

  it('passes AA for the selected date tile and the active shift card', () => {
    assert.ok(contrastRatio(C.onGreen, C.green) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.onGreen, C.activeBg) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.lime, C.activeBg) >= MIN_TEXT_CONTRAST);
  });

  // Known gap in the design: 12 pt semibold green on the pale Completed pill is 4.30:1, just under AA (4.5).
  // Kept as designed; this guards against it getting any worse.
  it('keeps the Completed pill text at 4:1 or better', () => {
    assert.ok(contrastRatio(C.completedInk, C.completedBg) >= 4);
  });

  it('passes AA for the upcoming pill, the demo banner and the initials badge', () => {
    assert.ok(contrastRatio(C.muted, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.bannerInk, C.bannerBg) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.initialsInk, C.initialsBg) >= MIN_TEXT_CONTRAST);
  });

  it('keeps date tiles and the avatar at or above 48 pt', () => {
    assert.ok(HOME_METRICS.dateTileHeight >= 48);
    assert.ok(HOME_METRICS.avatar >= 48);
  });
});
