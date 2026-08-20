import { readCache } from './repository.js';
import { getOverrides, mergeWithOverrides } from './overrides.repository.js';
import type { AmbrMaterialSummary, CharacterMaterials } from '../types/ambr.types.js';

export async function listAllMaterials(): Promise<AmbrMaterialSummary[]> {
  return readCache<AmbrMaterialSummary>('materials.json');
}

export async function findMaterialByName(name: string): Promise<AmbrMaterialSummary | undefined> {
  const all = await listAllMaterials();
  const normalized = name.trim().toLowerCase();
  return all.find((material) => material.name.toLowerCase() === normalized);
}

export async function listCharacterMaterials(): Promise<CharacterMaterials[]> {
  const [materials, overrides] = await Promise.all([
    readCache<CharacterMaterials>('character-materials.json'),
    getOverrides('character_materials'),
  ]);
  return mergeWithOverrides(materials, overrides, (entry) => entry.characterId.toString());
}

export async function findMaterialsByCharacterName(
  name: string,
): Promise<CharacterMaterials | undefined> {
  const all = await listCharacterMaterials();
  const normalized = name.trim().toLowerCase();
  return all.find((entry) => entry.characterName.toLowerCase() === normalized);
}
