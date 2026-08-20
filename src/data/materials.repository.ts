import { and, eq } from 'drizzle-orm';
import { groupMaterialSlots } from './materials-grouping.js';
import type { MaterialSlotRow } from './materials-grouping.js';
import { db } from '../db/client.js';
import { characterMaterialSlots, characters, materials } from '../db/schema.js';
import type { AmbrMaterialSummary, CharacterMaterials } from '../types/ambr.types.js';

export async function listCharacterMaterials(): Promise<CharacterMaterials[]> {
  const rows: MaterialSlotRow[] = await db
    .select({
      characterId: characters.id,
      characterName: characters.name,
      characterIcon: characters.icon,
      slot: characterMaterialSlots.slot,
      materialId: materials.id,
      materialName: materials.name,
      materialIcon: materials.icon,
      materialRank: materials.rank,
    })
    .from(characterMaterialSlots)
    .innerJoin(characters, eq(characterMaterialSlots.characterId, characters.id))
    .innerJoin(materials, eq(characterMaterialSlots.materialId, materials.id))
    .where(and(eq(characterMaterialSlots.hidden, false), eq(characters.hidden, false)));

  return groupMaterialSlots(rows);
}

export async function findMaterialsByCharacterName(
  name: string,
): Promise<CharacterMaterials | undefined> {
  const all = await listCharacterMaterials();
  const normalized = name.trim().toLowerCase();
  return all.find((entry) => entry.characterName.toLowerCase() === normalized);
}

export async function listAllMaterials(): Promise<AmbrMaterialSummary[]> {
  const rows = await db.select().from(materials);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    ...(row.rank !== null && { rank: row.rank }),
  }));
}

export async function findMaterialByName(name: string): Promise<AmbrMaterialSummary | undefined> {
  const all = await listAllMaterials();
  const normalized = name.trim().toLowerCase();
  return all.find((material) => material.name.toLowerCase() === normalized);
}
