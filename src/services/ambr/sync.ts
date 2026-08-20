import { disambiguatedName } from './character-name.js';
import { fetchAmbrDetail, fetchAmbrList } from './client.js';
import { buildCharacterMaterials } from './materials.js';
import { readCache, writeCacheFile } from '../../data/repository.js';
import { logger } from '../../lib/logger.js';
import type {
  AmbrArtifactSetSummary,
  AmbrAvatarDetail,
  AmbrCharacterSummary,
  AmbrMaterialSummary,
  AmbrWeaponSummary,
  CharacterMaterials,
  GenshinElement,
} from '../../types/ambr.types.js';

// This hits the detail endpoint once per character (127 requests) rather than the ~4
// list-endpoint calls the other syncs make, so it's kept as a separate, slower sync job.
const REQUEST_DELAY_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RawCharacter {
  id: number;
  rank: number;
  name: string;
  element: GenshinElement | null;
  weaponType: string;
  region?: string;
  icon: string;
}

interface RawWeapon {
  id: number;
  rank: number;
  type: string;
  name: string;
  icon: string;
}

interface RawArtifactSet {
  id: number;
  name: string;
  icon: string;
}

interface RawMaterial {
  id: number;
  name: string;
  type: string;
  rank?: number;
  icon: string;
}

export async function syncCharacters(): Promise<AmbrCharacterSummary[]> {
  const raw = await fetchAmbrList<RawCharacter>('avatar');
  // Entries with no element are non-playable placeholders (e.g. outfit-preview mannequins), not real characters.
  const characters: AmbrCharacterSummary[] = Object.values(raw)
    .filter((item): item is RawCharacter & { element: GenshinElement } => item.element !== null)
    .map((item) => ({
      id: item.id,
      rank: item.rank,
      name: disambiguatedName(item.name, item.element),
      element: item.element,
      weaponType: item.weaponType,
      icon: item.icon,
      ...(item.region !== undefined && { region: item.region }),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  await writeCacheFile('characters.json', characters);
  return characters;
}

export async function syncWeapons(): Promise<AmbrWeaponSummary[]> {
  const raw = await fetchAmbrList<RawWeapon>('weapon');
  const weapons: AmbrWeaponSummary[] = Object.values(raw).map((item) => ({
    id: item.id,
    rank: item.rank,
    type: item.type,
    name: item.name,
    icon: item.icon,
  }));
  await writeCacheFile('weapons.json', weapons);
  return weapons;
}

export async function syncArtifactSets(): Promise<AmbrArtifactSetSummary[]> {
  const raw = await fetchAmbrList<RawArtifactSet>('reliquary');
  const artifactSets: AmbrArtifactSetSummary[] = Object.values(raw).map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
  }));
  await writeCacheFile('artifact-sets.json', artifactSets);
  return artifactSets;
}

export async function syncMaterials(): Promise<AmbrMaterialSummary[]> {
  const raw = await fetchAmbrList<RawMaterial>('material');
  const materials: AmbrMaterialSummary[] = Object.values(raw).map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    icon: item.icon,
    ...(item.rank !== undefined && { rank: item.rank }),
  }));
  await writeCacheFile('materials.json', materials);
  return materials;
}

export async function syncCharacterMaterials(): Promise<CharacterMaterials[]> {
  const characters = await readCache<AmbrCharacterSummary>('characters.json');
  const materials = await readCache<AmbrMaterialSummary>('materials.json');
  const materialTypes = new Map(materials.map((material) => [material.id, material.type]));

  const results: CharacterMaterials[] = [];
  for (const character of characters) {
    try {
      const detail = await fetchAmbrDetail<AmbrAvatarDetail>('avatar', character.id);
      // The detail endpoint returns Ambr's raw (Traveler-ambiguous) name — use the
      // already-disambiguated one from characters.json instead, so /materials matches
      // /character and /build for the Traveler variants.
      results.push({
        ...buildCharacterMaterials(detail, materialTypes),
        characterName: character.name,
      });
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
