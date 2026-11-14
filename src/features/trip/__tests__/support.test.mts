import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { supportTelUrl } from '../../../config/support.ts';

describe('supportTelUrl', () => {
  it('builds a tel link from a plain number', () => {
    assert.equal(supportTelUrl('9876543210'), 'tel:9876543210');
  });

  it('keeps one leading plus and strips spaces, dashes and brackets', () => {
    assert.equal(supportTelUrl('+91 98765-43210'), 'tel:+919876543210');
    assert.equal(supportTelUrl('(020) 4000 1234'), 'tel:02040001234');
  });

  it('drops plus signs that are not at the start', () => {
    assert.equal(supportTelUrl('91+9876543210'), 'tel:919876543210');
  });

  it('returns null when nothing usable is set', () => {
    assert.equal(supportTelUrl(undefined), null);
    assert.equal(supportTelUrl(''), null);
    assert.equal(supportTelUrl('   '), null);
    assert.equal(supportTelUrl('call us'), null);
    assert.equal(supportTelUrl('12345'), null);
  });
});
