import type {
  AmbrAvatarDetail,
  CharacterAscensionMaterials,
  CharacterMaterials,
  CharacterTalentMaterials,
  MaterialRef,
} from '../../types/ambr.types.js';

function collectCostItemIds(sources: (Record<string, number> | null | undefined)[]): number[] {
  const ids = new Set<number>();
  for (const source of sources) {
    if (!source) continue;
    for (const idStr of Object.keys(source)) ids.add(Number(idStr));
  }
  return [...ids];
}

function omitUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined)) as T;
}

function pickBest(
  ids: number[],
  detail: AmbrAvatarDetail,
  materialTypes: Map<number, string>,
  matches: (type: string, rank: number) => boolean,
): MaterialRef | undefined {
  let best: MaterialRef | undefined;
  for (const id of ids) {
    const type = materialTypes.get(id);
    const item = detail.items[String(id)];
    if (!type || !item || !matches(type, item.rank)) continue;
    if (!best || item.rank > best.rank) {
      best = { id, name: item.name, icon: item.icon, rank: item.rank };
    }
  }
  return best;
}

export function buildCharacterMaterials(
  detail: AmbrAvatarDetail,
  materialTypes: Map<number, string>,
): CharacterMaterials {
  const ascensionIds = collectCostItemIds(
    detail.upgrade.promote.map((promote) => promote.costItems),
  );
  // Passive talents have no "promote" field at all (only active skills can be upgraded).
  const talentIds = collectCostItemIds(
    Object.values(detail.talent).flatMap((talent) =>
      Object.values(talent.promote ?? {}).map((promote) => promote.costItems),
    ),
  );

  const ascension = omitUndefined({
    localSpecialty: pickBest(ascensionIds, detail, materialTypes, (type) =>
      type.startsWith('localSpecialty'),
    ),
    gem: pickBest(
      ascensionIds,
      detail,
      materialTypes,
      (type) => type === 'characterAscensionMaterial',
    ),
    commonDrop: pickBest(
      ascensionIds,
      detail,
      materialTypes,
      (type) => type === 'characterandWeaponEnhancementMaterial',
    ),
    bossMaterial: pickBest(
      ascensionIds,
      detail,
      materialTypes,
      (type) => type === 'characterLevelUpMaterial',
    ),
  }) as CharacterAscensionMaterials;

  const talents = omitUndefined({
    commonDrop: pickBest(
      talentIds,
      detail,
      materialTypes,
      (type) => type === 'characterandWeaponEnhancementMaterial',
    ),
    // Crown of Insight shares the "characterTalentMaterial" type with the regional book
    // chain but is the only rank-5 entry in that type, so rank splits the two apart.
    book: pickBest(
      talentIds,
      detail,
      materialTypes,
      (type, rank) => type === 'characterTalentMaterial' && rank < 5,
    ),
    bossMaterial: pickBest(
      talentIds,
      detail,
      materialTypes,
      (type) => type === 'characterLevelUpMaterial',
    ),
    crown: pickBest(
      talentIds,
      detail,
      materialTypes,
      (type, rank) => type === 'characterTalentMaterial' && rank === 5,
    ),
  }) as CharacterTalentMaterials;

  return {
    characterId: detail.id,
    characterName: detail.name,
    characterIcon: detail.icon,
    ascension,
    talents,
  };
}
