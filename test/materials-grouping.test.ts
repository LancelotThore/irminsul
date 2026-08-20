import { describe, expect, it } from 'vitest';
import { groupMaterialSlots } from '../src/data/materials-grouping.js';
import type { MaterialSlotRow } from '../src/data/materials-grouping.js';

const baseRow = {
  characterId: '1',
  characterName: 'Amber',
  characterIcon: 'UI_AvatarIcon_Amber',
};

describe('groupMaterialSlots', () => {
  it('groups multiple slot rows for the same character into one nested entry', () => {
    const rows: MaterialSlotRow[] = [
      {
        ...baseRow,
        slot: 'ascension_gem',
        materialId: 1,
        materialName: 'Gem Fragment',
        materialIcon: 'icon1',
        materialRank: 3,
      },
      {
        ...baseRow,
        slot: 'talent_book',
        materialId: 2,
        materialName: 'Philosophy',
        materialIcon: 'icon2',
        materialRank: 4,
      },
    ];

    const result = groupMaterialSlots(rows);

    expect(result).toHaveLength(1);
    expect(result[0]?.characterName).toBe('Amber');
    expect(result[0]?.ascension.gem?.name).toBe('Gem Fragment');
    expect(result[0]?.talents.book?.name).toBe('Philosophy');
  });

  it('keeps separate characters as separate entries', () => {
    const rows: MaterialSlotRow[] = [
      {
        ...baseRow,
        slot: 'ascension_gem',
        materialId: 1,
        materialName: 'Gem Fragment',
        materialIcon: 'icon1',
        materialRank: 3,
      },
      {
        characterId: '2',
        characterName: 'Amber Duplicate',
        characterIcon: 'UI_AvatarIcon_Other',
        slot: 'ascension_gem',
        materialId: 1,
        materialName: 'Gem Fragment',
        materialIcon: 'icon1',
        materialRank: 3,
      },
    ];

    expect(groupMaterialSlots(rows)).toHaveLength(2);
  });

  it('falls back to rank 0 when the catalog rank is null', () => {
    const rows: MaterialSlotRow[] = [
      {
        ...baseRow,
        slot: 'ascension_gem',
        materialId: 1,
        materialName: 'Mystery Item',
        materialIcon: 'icon1',
        materialRank: null,
      },
    ];

    expect(groupMaterialSlots(rows)[0]?.ascension.gem?.rank).toBe(0);
  });

  it('returns an empty array for no rows', () => {
    expect(groupMaterialSlots([])).toEqual([]);
  });
});
