import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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

// Farming-materials guide image, scraped from Sephijin — mirrors gazetteBuilds exactly
// (same key/shape/governance), since it's the same kind of content from a different
// site. Replaced the old Ambr-computed ascension/talent breakdown entirely: that
// required a `materials` catalog table and a `character_material_slots` join table,
// which are gone now that nothing derives per-slot data anymore.
export const materialsGuides = sqliteTable('materials_guides', {
  // normalizeCharacterName(name) — same key as gazetteBuilds, same Voyageur handling.
  characterKey: text('character_key').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  imageUrl: text('image_url').notNull(),
  pageUrl: text('page_url').notNull(),
  source: text('source', { enum: ['sephijin', 'admin'] })
    .notNull()
    .default('sephijin'),
  ...governance,
});

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
