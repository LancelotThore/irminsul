import { readCache } from './repository.js';
import type { AmbrCharacterSummary } from '../types/ambr.types.js';

export async function listCharacters(): Promise<AmbrCharacterSummary[]> {
  return readCache<AmbrCharacterSummary>('characters.json');
}

export async function findCharacterByName(name: string): Promise<AmbrCharacterSummary | undefined> {
  const characters = await listCharacters();
  const normalized = name.trim().toLowerCase();
  return characters.find((character) => character.name.toLowerCase() === normalized);
}
