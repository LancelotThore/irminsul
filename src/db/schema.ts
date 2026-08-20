import { sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Columns shared by every table an admin can edit at runtime. `locked` is set the
// moment an admin touches a row; sync upserts are conditioned on `NOT locked`, so a
// manual edit is never silently overwritten by the next sync — no separate overlay
// table needed. `hidden` is a soft-delete for the same reason: a hard DELETE would
// leave nothing for a future sync to conflict against, so it would just get re-created.
const governance = {
  locked: integer('locked', { mode: 'boolean' }).notNull().default(false),
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedBy: text('updated_by'),
};

export const characters = sqliteTable('characters', {
  // Text, not integer: Ambr uses composite ids like "10000005-pyro" for Traveler
  // variants (one base character id, one suffix per element) — an integer column
  // would silently truncate or reject those.
  id: text('id').primaryKey(),
  rank: integer('rank').notNull(),
  name: text('name').notNull(),
  element: text('element', {
    enum: ['Fire', 'Water', 'Wind', 'Electric', 'Grass', 'Ice', 'Rock'],
  }).notNull(),
  weaponType: text('weapon_type').notNull(),
  region: text('region'),
  icon: text('icon').notNull(),
  source: text('source', { enum: ['ambr', 'admin'] })
    .notNull()
    .default('ambr'),
  ...governance,
});

export const weapons = sqliteTable('weapons', {
  id: integer('id').primaryKey(),
  rank: integer('rank').notNull(),
  type: text('type').notNull(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
});

export const artifactSets = sqliteTable('artifact_sets', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
});

export const materials = sqliteTable('materials', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  rank: integer('rank'),
  icon: text('icon').notNull(),
});

// Replaces the old nested-JSON character-materials blob (which duplicated each
// material's name/icon/rank at every slot it appeared in). One row per filled
// ascension/talent slot, referencing `materials` by id instead of embedding a copy.
export const characterMaterialSlots = sqliteTable(
  'character_material_slots',
  {
    characterId: text('character_id').notNull(),
    slot: text('slot', {
      enum: [
        'ascension_localSpecialty',
        'ascension_gem',
        'ascension_commonDrop',
        'ascension_bossMaterial',
        'talent_commonDrop',
        'talent_book',
        'talent_bossMaterial',
        'talent_crown',
      ],
    }).notNull(),
    materialId: integer('material_id').notNull(),
    source: text('source', { enum: ['ambr', 'admin'] })
      .notNull()
      .default('ambr'),
    ...governance,
  },
  (table) => [primaryKey({ columns: [table.characterId, table.slot] })],
);

export const gazetteBuilds = sqliteTable('gazette_builds', {
  // normalizeCharacterName(name) — already folds the Voyageur/Voyageuse gender
  // difference, since La Gazette's guides aren't split by gender, only by element.
  characterKey: text('character_key').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(),
  pageUrl: text('page_url').notNull(),
  source: text('source', { enum: ['gazette', 'admin'] })
    .notNull()
    .default('gazette'),
  ...governance,
});

export const reminders = sqliteTable('reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  server: text('server', { enum: ['asia', 'europe', 'america'] }).notNull(),
  type: text('type', { enum: ['daily', 'weekly'] }).notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});
