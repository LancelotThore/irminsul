import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { characters } from '../db/schema.js';
import type { AmbrCharacterSummary, GenshinElement } from '../types/ambr.types.js';

export interface CharacterFilters {
  element?: GenshinElement;
  weaponType?: string;
  rank?: number;
}

function toSummary(row: typeof characters.$inferSelect): AmbrCharacterSummary {
  return {
    id: row.id,
    rank: row.rank,
    name: row.name,
    element: row.element,
    weaponType: row.weaponType,
    icon: row.icon,
    ...(row.region !== null && { region: row.region }),
  };
}

export async function listCharacters(
  filters: CharacterFilters = {},
): Promise<AmbrCharacterSummary[]> {
  const conditions = [eq(characters.hidden, false)];
  if (filters.element) conditions.push(eq(characters.element, filters.element));
  if (filters.weaponType) conditions.push(eq(characters.weaponType, filters.weaponType));
  if (filters.rank) conditions.push(eq(characters.rank, filters.rank));

  const rows = await db
    .select()
    .from(characters)
    .where(and(...conditions));

  return rows.map(toSummary).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export async function findCharacterByName(
  name: string,
  filters: CharacterFilters = {},
): Promise<AmbrCharacterSummary | undefined> {
  const list = await listCharacters(filters);
  const normalized = name.trim().toLowerCase();
  return list.find((character) => character.name.toLowerCase() === normalized);
}
