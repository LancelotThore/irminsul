import { fetchAmbrList } from './client.js';
import { writeCacheFile } from '../../data/repository.js';
import type {
  AmbrArtifactSetSummary,
  AmbrCharacterSummary,
  AmbrMaterialSummary,
  AmbrWeaponSummary,
  GenshinElement,
} from '../../types/ambr.types.js';

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
      name: item.name,
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
