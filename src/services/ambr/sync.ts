import { eq, sql } from 'drizzle-orm';
import { disambiguatedName } from './character-name.js';
import { fetchAmbrDetail, fetchAmbrList } from './client.js';
import { buildCharacterMaterials } from './materials.js';
import { db } from '../../db/client.js';
import {
  artifactSets,
  characterMaterialSlots,
  characters,
  materials as materialsTable,
  weapons,
} from '../../db/schema.js';
import { ASCENSION_KEYS, TALENT_KEYS } from '../../lib/material-slots.js';
import type { MaterialSlot } from '../../lib/material-slots.js';
import { logger } from '../../lib/logger.js';
import type {
  AmbrArtifactSetSummary,
  AmbrAvatarDetail,
  AmbrCharacterSummary,
  AmbrMaterialSummary,
  AmbrWeaponSummary,
  CharacterMaterials,
  GenshinElement,
  MaterialRef,
} from '../../types/ambr.types.js';

// This hits the detail endpoint once per character (127+ requests) rather than the ~4
// list-endpoint calls the other syncs make, so it's kept as a separate, slower sync job.
const REQUEST_DELAY_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface RawCharacter {
  // Ambr's raw JSON has this as a genuine number for ordinary characters (e.g. 10000002)
  // but a compound string for Traveler variants (e.g. "10000005-pyro") — always coerce
  // with String() below rather than storing the raw value: better-sqlite3 binds a plain
  // JS number into a TEXT column as SQLite REAL, which round-trips back out as "X.0"
  // instead of "X" (verified directly against better-sqlite3, independent of Drizzle).
  id: number | string;
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
  const items: AmbrCharacterSummary[] = Object.values(raw)
    .filter((item): item is RawCharacter & { element: GenshinElement } => item.element !== null)
    .map((item) => ({
      id: String(item.id),
      rank: item.rank,
      name: disambiguatedName(item.name, item.element),
      element: item.element,
      weaponType: item.weaponType,
      icon: item.icon,
      ...(item.region !== undefined && { region: item.region }),
    }));

  for (const item of items) {
    const { id, ...rest } = item;
    await db
      .insert(characters)
      .values({ id, ...rest, source: 'ambr' })
      .onConflictDoUpdate({
        target: characters.id,
        set: { ...rest, source: 'ambr', updatedAt: sql`(current_timestamp)` },
        setWhere: eq(characters.locked, false),
      });
  }

  return items.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

export async function syncWeapons(): Promise<AmbrWeaponSummary[]> {
  const raw = await fetchAmbrList<RawWeapon>('weapon');
  const items: AmbrWeaponSummary[] = Object.values(raw).map((item) => ({
    id: item.id,
    rank: item.rank,
    type: item.type,
    name: item.name,
    icon: item.icon,
  }));

  for (const item of items) {
    const { id, ...rest } = item;
    await db
      .insert(weapons)
      .values({ id, ...rest })
      .onConflictDoUpdate({ target: weapons.id, set: rest });
  }

  return items;
}

export async function syncArtifactSets(): Promise<AmbrArtifactSetSummary[]> {
  const raw = await fetchAmbrList<RawArtifactSet>('reliquary');
  const items: AmbrArtifactSetSummary[] = Object.values(raw).map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
  }));

  for (const item of items) {
    const { id, ...rest } = item;
    await db
      .insert(artifactSets)
      .values({ id, ...rest })
      .onConflictDoUpdate({ target: artifactSets.id, set: rest });
  }

  return items;
}

export async function syncMaterials(): Promise<AmbrMaterialSummary[]> {
  const raw = await fetchAmbrList<RawMaterial>('material');
  const items: AmbrMaterialSummary[] = Object.values(raw).map((item) => ({
    id: item.id,
    name: item.name,
    type: item.type,
    icon: item.icon,
    ...(item.rank !== undefined && { rank: item.rank }),
  }));

  for (const item of items) {
    const { id, ...rest } = item;
    await db
      .insert(materialsTable)
      .values({ id, ...rest })
      .onConflictDoUpdate({ target: materialsTable.id, set: rest });
  }

  return items;
}

async function upsertSlot(
  characterId: string,
  slot: MaterialSlot,
  ref: MaterialRef | undefined,
): Promise<void> {
  if (!ref) return;
  await db
    .insert(characterMaterialSlots)
    .values({ characterId, slot, materialId: ref.id, source: 'ambr' })
    .onConflictDoUpdate({
      target: [characterMaterialSlots.characterId, characterMaterialSlots.slot],
      set: { materialId: ref.id, source: 'ambr', updatedAt: sql`(current_timestamp)` },
      setWhere: eq(characterMaterialSlots.locked, false),
    });
}

export async function syncCharacterMaterials(): Promise<CharacterMaterials[]> {
  const characterRows = await db.select().from(characters).where(eq(characters.hidden, false));
  const materialRows = await db.select().from(materialsTable);
  const materialTypes = new Map(materialRows.map((material) => [material.id, material.type]));

  const results: CharacterMaterials[] = [];
  for (const character of characterRows) {
    try {
      const detail = await fetchAmbrDetail<AmbrAvatarDetail>('avatar', character.id);
      // The detail endpoint returns Ambr's raw (Traveler-ambiguous) name/id — use the
      // already-disambiguated character row instead, so /materials matches /character
      // and /build for the Traveler variants.
      const built = buildCharacterMaterials(detail, materialTypes);
      const result: CharacterMaterials = {
        ...built,
        characterId: character.id,
        characterName: character.name,
      };
      results.push(result);

      for (const key of ASCENSION_KEYS) {
        await upsertSlot(character.id, `ascension_${key}`, result.ascension[key]);
      }
      for (const key of TALENT_KEYS) {
        await upsertSlot(character.id, `talent_${key}`, result.talents[key]);
      }
    } catch (error) {
      logger.warn(
        { err: error, character: character.name },
        'Failed to fetch character detail, skipping',
      );
    }
    await sleep(REQUEST_DELAY_MS);
  }

  return results;
}
