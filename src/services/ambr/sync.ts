import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchAmbrList, fetchWeaponTypeLabels } from './client.js';
import type {
  AmbrArtifactSetSummary,
  AmbrCharacterSummary,
  AmbrMaterialSummary,
  AmbrWeaponSummary,
  GenshinElement,
} from '../../types/ambr.types.js';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');

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

// Write to a temp file then rename, so a failed sync never leaves a truncated/corrupt cache file behind.
async function writeCacheFile(filename: string, data: unknown): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const finalPath = path.join(CACHE_DIR, filename);
  const tempPath = `${finalPath}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await rename(tempPath, finalPath);
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

export async function syncWeaponTypeLabels(): Promise<Record<string, string>> {
  const labels = await fetchWeaponTypeLabels();
  await writeCacheFile('weapon-type-labels.json', labels);
  return labels;
}
