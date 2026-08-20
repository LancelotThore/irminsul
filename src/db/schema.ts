import { sql } from 'drizzle-orm';
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// Generic overlay for manually-added/edited/deleted game data. Sync jobs only ever
// rewrite the JSON cache (data/cache/*.json); repositories merge that base data with
// the rows here at read time, so manual edits survive the next sync.
export const dataOverrides = sqliteTable(
  'data_overrides',
  {
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    // Full JSON-serialized record of the entity's shape. Null when deleted=1, since a
    // soft-deleted entry has nothing left to merge in.
    data: text('data'),
    deleted: integer('deleted', { mode: 'boolean' }).notNull().default(false),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`(current_timestamp)`),
    updatedBy: text('updated_by').notNull(),
  },
  (table) => [primaryKey({ columns: [table.entityType, table.entityId] })],
);

export const reminders = sqliteTable('reminders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(),
  server: text('server', { enum: ['asia', 'europe', 'america'] }).notNull(),
  type: text('type', { enum: ['daily', 'weekly'] }).notNull(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
});
