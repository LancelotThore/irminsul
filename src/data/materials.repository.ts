import { readCache } from './repository.js';
import type { CharacterMaterials } from '../types/ambr.types.js';

export async function listCharacterMaterials(): Promise<CharacterMaterials[]> {
  return readCache<CharacterMaterials>('character-materials.json');
}

export async function findMaterialsByCharacterName(
  name: string,
): Promise<CharacterMaterials | undefined> {
  const all = await listCharacterMaterials();
  const normalized = name.trim().toLowerCase();
  return all.find((entry) => entry.characterName.toLowerCase() === normalized);
}
