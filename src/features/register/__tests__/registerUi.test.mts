import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import { BLOOD_GROUPS, LEAD_STEPS } from '../leadForm.ts';
import { progressLabel, STEP_HEADINGS, STEP_PRIMARY_LABEL } from '../ui/registerContent.ts';
import { chunk, formatPhoneDisplay, progressPercent } from '../ui/registerFormat.ts';
import { REGISTER_COLORS as C, REGISTER_METRICS } from '../ui/registerTheme.ts';

describe('formatPhoneDisplay', () => {
  it('groups a full number as 5 + 5', () => {
    assert.equal(formatPhoneDisplay('9876543210'), '98765 43210');
  });

  it('leaves short input ungrouped', () => {
    assert.equal(formatPhoneDisplay(''), '');
    assert.equal(formatPhoneDisplay('98'), '98');
    assert.equal(formatPhoneDisplay('98765'), '98765');
  });

  it('groups as the rider types past five digits', () => {
    assert.equal(formatPhoneDisplay('987654'), '98765 4');
  });

  it('ignores non-digits and extra digits', () => {
    assert.equal(formatPhoneDisplay('98765 43210'), '98765 43210');
    assert.equal(formatPhoneDisplay('+91 98765-43210 99'), '91987 65432');
  });
});

describe('progressPercent', () => {
  it('is 25% on the first of four steps and 100% on the last', () => {
    assert.equal(progressPercent(0, 4), 25);
    assert.equal(progressPercent(1, 4), 50);
    assert.equal(progressPercent(3, 4), 100);
  });

  it('stays within 0 to 100 for odd input', () => {
    assert.equal(progressPercent(9, 4), 100);
    assert.equal(progressPercent(-5, 4), 0);
    assert.equal(progressPercent(0, 0), 0);
  });
});

describe('chunk', () => {
  it('splits blood groups into two rows of four', () => {
    const rows = chunk(BLOOD_GROUPS, REGISTER_METRICS.bloodColumns);
    assert.equal(rows.length, 2);
    assert.deepEqual(rows[0], ['A+', 'A-', 'B+', 'B-']);
    assert.deepEqual(rows[1], ['AB+', 'AB-', 'O+', 'O-']);
  });

  it('keeps a short last row and handles empty input and bad sizes', () => {
    assert.deepEqual(chunk([1, 2, 3, 4, 5], 4), [[1, 2, 3, 4], [5]]);
    assert.deepEqual(chunk([], 4), []);
    assert.deepEqual(chunk([1, 2], 0), []);
  });
});

describe('step content', () => {
  it('has a heading and a main-button label for every step', () => {
    for (const step of LEAD_STEPS) {
      assert.ok(STEP_HEADINGS[step].title.length > 0, step);
      assert.ok(STEP_HEADINGS[step].subtitle.length > 0, step);
      assert.ok(STEP_PRIMARY_LABEL[step].length > 0, step);
    }
  });

  it('uses the Figma copy on step 1', () => {
    assert.equal(STEP_HEADINGS.personal.title, 'Tell us about yourself');
    assert.equal(STEP_PRIMARY_LABEL.personal, 'Continue to ID Address');
  });

  it('submits on the last step and labels the progress "Final" there', () => {
    assert.equal(STEP_PRIMARY_LABEL.bank, 'Submit Application');
    assert.equal(progressLabel(25), '25% Completed');
    assert.equal(progressLabel(75), '75% Completed');
    assert.equal(progressLabel(100), '100% Final');
  });
});

describe('register colours and metrics', () => {
  it('passes AA for the main button, headings and body copy', () => {
    assert.ok(contrastRatio(C.onGreen, C.green) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.ink, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.body, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.muted, C.card) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.greenDeep, C.canvas) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.greenDeep, C.tile) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.required, C.card) >= MIN_TEXT_CONTRAST);
  });

  // Known gap in the design: placeholder and the "For digital payout receipts" hint are #a7b0a9, about 2.2:1.
  // Placeholders are exempt from AA but the hint is not; kept as designed, this guards against it getting worse.
  it('keeps the light hint text above 2:1', () => {
    assert.ok(contrastRatio(C.placeholder, C.card) >= 2);
  });

  it('keeps fields and chips at a comfortable touch height', () => {
    assert.ok(REGISTER_METRICS.fieldHeight >= 48);
    assert.ok(REGISTER_METRICS.bloodChipHeight >= 44);
    assert.ok(REGISTER_METRICS.backSize >= 44);
    assert.ok(REGISTER_METRICS.buttonHeight >= 48);
  });
});
