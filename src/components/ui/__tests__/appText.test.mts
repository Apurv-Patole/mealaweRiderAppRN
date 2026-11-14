import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HEADING_VARIANTS, MAX_FONT_SCALE } from '../textA11y.ts';

describe('AppText accessibility rules', () => {
  it('announces only the large variants as headings', () => {
    assert.deepEqual([...HEADING_VARIANTS], ['display', 'h1', 'h2']);
  });

  it('allows system font scaling but caps it so rows do not break', () => {
    assert.ok(MAX_FONT_SCALE > 1 && MAX_FONT_SCALE <= 1.5);
  });
});
