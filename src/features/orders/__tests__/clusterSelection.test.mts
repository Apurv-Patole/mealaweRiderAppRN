import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { effectiveClusterIds, isClusterSelected, toggleCluster } from '../clusterSelection.ts';

const ALL = ['a', 'b', 'c'];

describe('effectiveClusterIds', () => {
  it('is every cluster when nothing has been narrowed', () => {
    assert.deepEqual(effectiveClusterIds(null, ALL), ALL);
  });

  it('is the selected clusters, in the rider\'s order, ignoring unknown ids', () => {
    assert.deepEqual(effectiveClusterIds(['c', 'a', 'zzz'], ALL), ['a', 'c']);
  });
});

describe('toggleCluster', () => {
  it('turns one cluster off from "all"', () => {
    assert.deepEqual(toggleCluster(null, ALL, 'b'), ['a', 'c']);
  });

  it('turns a cluster back on, and returns to "all" when everything is selected again', () => {
    assert.deepEqual(toggleCluster(['a'], ALL, 'b'), ['a', 'b']);
    assert.equal(toggleCluster(['a', 'b'], ALL, 'c'), null);
  });

  it('refuses to switch off the last selected cluster', () => {
    assert.deepEqual(toggleCluster(['a'], ALL, 'a'), ['a']);
    assert.equal(toggleCluster(null, ['only'], 'only'), null);
  });

  it('ignores an id the rider does not have', () => {
    assert.equal(toggleCluster(null, ALL, 'zzz'), null);
  });

  it('does not mutate the previous selection', () => {
    const before = ['a', 'b'];
    toggleCluster(before, ALL, 'c');
    assert.deepEqual(before, ['a', 'b']);
  });
});

describe('isClusterSelected', () => {
  it('treats "all" as selected and checks membership otherwise', () => {
    assert.equal(isClusterSelected(null, 'a'), true);
    assert.equal(isClusterSelected(['a'], 'a'), true);
    assert.equal(isClusterSelected(['a'], 'b'), false);
  });
});
