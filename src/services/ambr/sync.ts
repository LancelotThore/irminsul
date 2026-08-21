import { eq, sql } from 'drizzle-orm';
import { disambiguatedName, isCanonicalCharacter } from './character-name.js';
import { fetchAmbrList } from './client.js';
import { db } from '../../db/client.js';
import { artifactSets, characters, weapons } from '../../db/schema.js';
import type {
  AmbrArtifactSetSummary,
  AmbrCharacterSummary,
  AmbrWeaponSummary,
  GenshinElement,
} from '../../types/ambr.types.js';

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

export async function syncCharacters(): Promise<AmbrCharacterSummary[]> {
  const raw = await fetchAmbrList<RawCharacter>('avatar');
  // Entries with no element are non-playable placeholders (e.g. outfit-preview mannequins), not real characters.
  const items: AmbrCharacterSummary[] = Object.values(raw)
    .filter((item): item is RawCharacter & { element: GenshinElement } => item.element !== null)
    .filter((item) => isCanonicalCharacter(item.name))
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
