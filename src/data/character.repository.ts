import { readCache } from './repository.js';
import { getOverrides, mergeWithOverrides } from './overrides.repository.js';
import type { AmbrCharacterSummary, GenshinElement } from '../types/ambr.types.js';

export interface CharacterFilters {
  element?: GenshinElement;
  weaponType?: string;
  rank?: number;
}

function matchesFilters(character: AmbrCharacterSummary, filters: CharacterFilters): boolean {
  if (filters.element && character.element !== filters.element) return false;
  if (filters.weaponType && character.weaponType !== filters.weaponType) return false;
  if (filters.rank && character.rank !== filters.rank) return false;
  return true;
}

export async function listCharacters(
  filters: CharacterFilters = {},
): Promise<AmbrCharacterSummary[]> {
  const [characters, overrides] = await Promise.all([
    readCache<AmbrCharacterSummary>('characters.json'),
    getOverrides('character'),
  ]);
  const merged = mergeWithOverrides(characters, overrides, (character) => character.id.toString());
  return merged.filter((character) => matchesFilters(character, filters));
}

export async function findCharacterByName(
  name: string,
  filters: CharacterFilters = {},
): Promise<AmbrCharacterSummary | undefined> {
  const characters = await listCharacters(filters);
  const normalized = name.trim().toLowerCase();
  return characters.find((character) => character.name.toLowerCase() === normalized);
}
