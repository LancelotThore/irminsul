import { describe, expect, it } from 'vitest';
import { mergeWithOverrides } from '../src/data/overrides.repository.js';
import type { OverrideRow } from '../src/data/overrides.repository.js';

interface Item {
  id: string;
  name: string;
}

const keyOf = (item: Item): string => item.id;

describe('mergeWithOverrides', () => {
  it('returns the base list unchanged when there are no overrides', () => {
    const base: Item[] = [{ id: '1', name: 'Aino' }];
    expect(mergeWithOverrides(base, [], keyOf)).toEqual(base);
  });

  it('replaces a base entry that has a matching, non-deleted override', () => {
    const base: Item[] = [{ id: '1', name: 'Aino' }];
    const overrides: OverrideRow[] = [
      { entityId: '1', data: JSON.stringify({ id: '1', name: 'Renamed' }), deleted: false },
    ];
    expect(mergeWithOverrides(base, overrides, keyOf)).toEqual([{ id: '1', name: 'Renamed' }]);
  });

  it('drops a base entry whose override is marked deleted', () => {
    const base: Item[] = [
      { id: '1', name: 'Aino' },
      { id: '2', name: 'Amber' },
    ];
    const overrides: OverrideRow[] = [{ entityId: '1', data: null, deleted: true }];
    expect(mergeWithOverrides(base, overrides, keyOf)).toEqual([{ id: '2', name: 'Amber' }]);
  });

  it('appends an override that has no matching base entry (fully custom entry)', () => {
    const base: Item[] = [{ id: '1', name: 'Aino' }];
    const overrides: OverrideRow[] = [
      { entityId: '99', data: JSON.stringify({ id: '99', name: 'Custom' }), deleted: false },
    ];
    expect(mergeWithOverrides(base, overrides, keyOf)).toEqual([
      { id: '1', name: 'Aino' },
      { id: '99', name: 'Custom' },
    ]);
  });

  it('ignores a deleted override that has no matching base entry', () => {
    const base: Item[] = [{ id: '1', name: 'Aino' }];
    const overrides: OverrideRow[] = [{ entityId: '99', data: null, deleted: true }];
    expect(mergeWithOverrides(base, overrides, keyOf)).toEqual(base);
  });
});
