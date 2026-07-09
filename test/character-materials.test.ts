import { describe, expect, it } from 'vitest';
import { buildCharacterMaterials } from '../src/services/ambr/materials.js';
import type { AmbrAvatarDetail } from '../src/types/ambr.types.js';

const materialTypes = new Map<number, string>([
  [1, 'localSpecialtyMondstadt'],
  [2, 'characterAscensionMaterial'],
  [3, 'characterAscensionMaterial'],
  [4, 'characterandWeaponEnhancementMaterial'],
  [5, 'characterLevelUpMaterial'], // ascension boss material
  [6, 'characterTalentMaterial'], // book, rank 3
  [7, 'characterTalentMaterial'], // book, rank 4 (top tier)
  [8, 'characterLevelUpMaterial'], // talent boss material
  [9, 'characterTalentMaterial'], // Crown of Insight, rank 5
]);

const detail: AmbrAvatarDetail = {
  id: 1,
  name: 'Test Character',
  icon: 'UI_AvatarIcon_Test',
  items: {
    '1': { name: 'Local Specialty', rank: 1, icon: 'icon1' },
    '2': { name: 'Gem Sliver', rank: 2, icon: 'icon2' },
    '3': { name: 'Gem Fragment', rank: 3, icon: 'icon3' },
    '4': { name: 'Common Drop', rank: 1, icon: 'icon4' },
    '5': { name: 'Ascension Boss Material', rank: 4, icon: 'icon5' },
    '6': { name: 'Teachings', rank: 3, icon: 'icon6' },
    '7': { name: 'Philosophy', rank: 4, icon: 'icon7' },
    '8': { name: 'Talent Boss Material', rank: 5, icon: 'icon8' },
    '9': { name: 'Crown of Insight', rank: 5, icon: 'icon9' },
  },
  upgrade: {
    promote: [
      { promoteLevel: 0 },
      { promoteLevel: 1, costItems: { '1': 3, '2': 1, '4': 3 } },
      { promoteLevel: 2, costItems: { '1': 10, '3': 3, '4': 15, '5': 2 } },
    ],
  },
  talent: {
    '0': {
      promote: {
        '1': { costItems: null },
        '2': { costItems: { '6': 3, '4': 6 } },
        '3': { costItems: { '7': 4, '8': 1 } },
        '10': { costItems: { '7': 16, '9': 1, '8': 2 } },
      },
    },
    // Passive talent: no "promote" field at all.
    '4': {},
  },
};

describe('buildCharacterMaterials', () => {
  const result = buildCharacterMaterials(detail, materialTypes);

  it('picks the highest-rank ascension gem, not the first one seen', () => {
    expect(result.ascension.gem?.name).toBe('Gem Fragment');
  });

  it('picks the ascension boss material', () => {
    expect(result.ascension.bossMaterial?.name).toBe('Ascension Boss Material');
  });

  it('picks the local specialty', () => {
    expect(result.ascension.localSpecialty?.name).toBe('Local Specialty');
  });

  it('separates Crown of Insight (rank 5) from the book chain (rank < 5)', () => {
    expect(result.talents.book?.name).toBe('Philosophy');
    expect(result.talents.crown?.name).toBe('Crown of Insight');
  });

  it('picks the talent boss material', () => {
    expect(result.talents.bossMaterial?.name).toBe('Talent Boss Material');
  });

  it('does not crash on passive talents that have no "promote" field', () => {
    expect(result.characterName).toBe('Test Character');
  });
});
