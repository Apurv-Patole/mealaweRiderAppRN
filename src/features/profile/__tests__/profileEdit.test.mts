import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { EDIT_TABS, firstTabWithError } from '../profileEdit.ts';

describe('edit profile tabs', () => {
  it('lists the four sections in order', () => {
    assert.deepEqual(
      EDIT_TABS.map((tab) => tab.value),
      ['personal', 'bank', 'documents', 'address'],
    );
  });

  it('returns null when there are no errors', () => {
    assert.equal(firstTabWithError({}), null);
  });

  it('finds the tab that holds the error', () => {
    assert.equal(firstTabWithError({ upiId: 'bad' }), 'bank');
    assert.equal(firstTabWithError({ 'residenceAddress.pincode': 'bad' }), 'address');
  });

  it('prefers the earliest tab when several have errors', () => {
    assert.equal(firstTabWithError({ 'residenceAddress.pincode': 'x', bankIfscCode: 'y', email: 'z' }), 'personal');
    assert.equal(firstTabWithError({ 'residenceAddress.pincode': 'x', bankIfscCode: 'y' }), 'bank');
  });
});
