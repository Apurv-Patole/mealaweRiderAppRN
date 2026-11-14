import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { contrastRatio, MIN_TEXT_CONTRAST } from '../../../theme/contrast.ts';
import { mergeDetected, placeToAddressPatch } from '../addressDetect.ts';
import { EMPTY_ADDRESS, LEAD_STEPS, type AddressDraft } from '../leadForm.ts';
import { backLabel, STEP_HEADINGS, STEP_PRIMARY_LABEL } from '../ui/registerContent.ts';
import { REGISTER_COLORS as C } from '../ui/registerTheme.ts';

describe('placeToAddressPatch', () => {
  it('takes pincode, city and state from a full place', () => {
    const patch = placeToAddressPatch({ postalCode: '411045', city: 'Pune', region: 'Maharashtra' });
    assert.deepEqual(patch, { pincode: '411045', city: 'Pune', state: 'Maharashtra' });
  });

  it('falls back to the sub-region when there is no city', () => {
    assert.equal(placeToAddressPatch({ postalCode: '411045', subregion: 'Pune District' }).city, 'Pune District');
  });

  it('drops a pincode that is not exactly 6 digits', () => {
    assert.equal(placeToAddressPatch({ postalCode: '4110' }).pincode, undefined);
    assert.equal(placeToAddressPatch({ postalCode: '41104A' }).pincode, undefined);
    assert.equal(placeToAddressPatch({ postalCode: '4110456' }).pincode, undefined);
  });

  it('accepts a pincode written with a space', () => {
    assert.equal(placeToAddressPatch({ postalCode: '411 045' }).pincode, '411045');
  });

  it('returns nothing for a missing place or empty fields', () => {
    assert.deepEqual(placeToAddressPatch(null), {});
    assert.deepEqual(placeToAddressPatch(undefined), {});
    assert.deepEqual(placeToAddressPatch({ postalCode: ' ', city: '', region: null }), {});
  });
});

describe('mergeDetected', () => {
  const typed: AddressDraft = { ...EMPTY_ADDRESS, line1: 'Flat 302', city: 'Pimpri', pincode: '000000' };

  it('always replaces the pincode', () => {
    assert.equal(mergeDetected(typed, { pincode: '411045' }).pincode, '411045');
  });

  it('never overwrites a city or state the rider already typed', () => {
    const merged = mergeDetected(typed, { pincode: '411045', city: 'Pune', state: 'Maharashtra' });
    assert.equal(merged.city, 'Pimpri');
    assert.equal(merged.state, 'Maharashtra');
  });

  it('keeps the other lines and does not mutate the input', () => {
    const before = { ...typed };
    const merged = mergeDetected(typed, { pincode: '411045' });
    assert.equal(merged.line1, 'Flat 302');
    assert.deepEqual(typed, before);
    assert.notEqual(merged, typed);
  });

  it('keeps the pincode when the patch has none', () => {
    assert.equal(mergeDetected(typed, { city: 'Pune' }).pincode, '000000');
  });
});

describe('back links and step 2 copy', () => {
  it('has no back link on the first step and names the previous step after that', () => {
    assert.equal(backLabel('personal'), null);
    assert.equal(backLabel('address'), 'Back to Personal Details');
    assert.equal(backLabel('kyc'), 'Back to Address');
    assert.equal(backLabel('bank'), 'Review previous steps');
  });

  it('uses the Figma copy on step 2', () => {
    assert.equal(STEP_HEADINGS.address.title, 'Where do you live?');
    assert.equal(STEP_HEADINGS.address.subtitle, 'Provide your current residential address for delivery hub assignment.');
    assert.equal(STEP_PRIMARY_LABEL.address, 'Continue to ID Document');
  });

  it('gives every step except the first a back link', () => {
    for (const step of LEAD_STEPS.slice(1)) assert.ok(backLabel(step), step);
  });
});

describe('step 2 colours', () => {
  it('passes AA for the mint banner text, the Required tag and the toggle copy', () => {
    assert.ok(contrastRatio(C.mintBannerInk, C.mintBannerBg) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.greenDeep, C.mintBannerBg) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.greenDeep, C.requiredTagBg) >= MIN_TEXT_CONTRAST);
    assert.ok(contrastRatio(C.body, C.card) >= MIN_TEXT_CONTRAST);
  });
});
