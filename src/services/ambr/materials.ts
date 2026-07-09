import { fetchAmbrDetail } from './client.js';
import { readCache, writeCacheFile } from '../../data/repository.js';
import { logger } from '../../lib/logger.js';
import type {
  AmbrAvatarDetail,
  AmbrCharacterSummary,
  AmbrMaterialSummary,
  CharacterAscensionMaterials,
  CharacterMaterials,
  CharacterTalentMaterials,
  MaterialRef,
} from '../../types/ambr.types.js';

// This hits the detail endpoint once per character (127 requests) rather than the ~4
// list-endpoint calls the main sync makes, so it's kept as a separate, slower sync job.
const REQUEST_DELAY_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export async function syncCharacterMaterials(): Promise<CharacterMaterials[]> {
  const characters = await readCache<AmbrCharacterSummary>('characters.json');
  const materials = await readCache<AmbrMaterialSummary>('materials.json');
  const materialTypes = new Map(materials.map((material) => [material.id, material.type]));

  const results: CharacterMaterials[] = [];
  for (const character of characters) {
    try {
      const detail = await fetchAmbrDetail<AmbrAvatarDetail>('avatar', character.id);
      results.push(buildCharacterMaterials(detail, materialTypes));
    } catch (error) {
      logger.warn(
        { err: error, character: character.name },
        'Failed to fetch character detail, skipping',
      );
    }
    await sleep(REQUEST_DELAY_MS);
  }

  await writeCacheFile('character-materials.json', results);
  return results;
}
