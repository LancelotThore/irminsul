import { sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { dataOverrides } from '../db/schema.js';

export type EntityType = 'character' | 'character_materials' | 'gazette_build';

export interface OverrideRow {
  entityId: string;
  data: string | null;
  deleted: boolean;
}

export async function getOverrides(entityType: EntityType): Promise<OverrideRow[]> {
  return db
    .select({
      entityId: dataOverrides.entityId,
      data: dataOverrides.data,
      deleted: dataOverrides.deleted,
    })
    .from(dataOverrides)
    .where(sql`${dataOverrides.entityType} = ${entityType}`);
}

export async function upsertOverride<T>(
  entityType: EntityType,
  entityId: string,
  data: T,
  updatedBy: string,
): Promise<void> {
  await db
    .insert(dataOverrides)
    .values({
      entityType,
      entityId,
      data: JSON.stringify(data),
      deleted: false,
      updatedBy,
    })
    .onConflictDoUpdate({
      target: [dataOverrides.entityType, dataOverrides.entityId],
      set: {
        data: JSON.stringify(data),
        deleted: false,
        updatedBy,
        updatedAt: sql`(current_timestamp)`,
      },
    });
}

export async function deleteOverride(
  entityType: EntityType,
  entityId: string,
  updatedBy: string,
): Promise<void> {
  await db
    .insert(dataOverrides)
    .values({ entityType, entityId, data: null, deleted: true, updatedBy })
    .onConflictDoUpdate({
      target: [dataOverrides.entityType, dataOverrides.entityId],
      set: { data: null, deleted: true, updatedBy, updatedAt: sql`(current_timestamp)` },
    });
}

// Pure fusion of synced base data with manual overrides — no I/O, so it can be unit
// tested directly. Overrides replace the base entry matching `keyOf`, are dropped when
// `deleted`, and are appended as new entries when they have no matching base entry
// (fully custom, not present in the synced data at all).
export function mergeWithOverrides<T>(
  base: T[],
  overrides: OverrideRow[],
  keyOf: (item: T) => string,
): T[] {
  const overrideByKey = new Map(overrides.map((override) => [override.entityId, override]));
  const merged: T[] = [];
  const baseKeys = new Set<string>();

  for (const item of base) {
    const key = keyOf(item);
    baseKeys.add(key);
    const override = overrideByKey.get(key);

    if (!override) {
      merged.push(item);
    } else if (!override.deleted && override.data) {
      merged.push(JSON.parse(override.data) as T);
    }
  }

  for (const override of overrides) {
    if (baseKeys.has(override.entityId) || override.deleted || !override.data) continue;
    merged.push(JSON.parse(override.data) as T);
  }

  return merged;
}
