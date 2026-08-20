import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { reminders } from '../db/schema.js';
import type { GenshinServer } from '../lib/genshin-servers.js';

export type ReminderType = 'daily' | 'weekly';

export interface Reminder {
  id: number;
  userId: string;
  server: GenshinServer;
  type: ReminderType;
}

export function addReminder(
  userId: string,
  server: GenshinServer,
  type: ReminderType,
): Promise<void> {
  db.insert(reminders).values({ userId, server, type }).run();
  return Promise.resolve();
}

// Returns false when no matching reminder existed, so the caller can tell the user
// there was nothing to remove.
export function removeReminder(
  userId: string,
  server: GenshinServer,
  type: ReminderType,
): Promise<boolean> {
  const result = db
    .delete(reminders)
    .where(
      and(eq(reminders.userId, userId), eq(reminders.server, server), eq(reminders.type, type)),
    )
    .run();
  return Promise.resolve(result.changes > 0);
}

export async function listRemindersForUser(userId: string): Promise<Reminder[]> {
  return db.select().from(reminders).where(eq(reminders.userId, userId));
}

export async function listAllReminders(): Promise<Reminder[]> {
  return db.select().from(reminders);
}
