import type { Client } from 'discord.js';
import { listAllReminders } from '../data/reminders.repository.js';
import type { Reminder } from '../data/reminders.repository.js';
import { SERVER_LABELS } from './genshin-servers.js';
import { logger } from './logger.js';
import { isResetDue } from './reminder-due.js';

const CHECK_INTERVAL_MS = 60_000;

const RESET_TYPE_LABELS: Record<Reminder['type'], string> = {
  daily: 'journalier',
  weekly: 'hebdomadaire',
};

async function notify(client: Client, reminder: Reminder): Promise<void> {
  try {
    const user = await client.users.fetch(reminder.userId);
    await user.send(
      `⏰ Le reset ${RESET_TYPE_LABELS[reminder.type]} du serveur **${SERVER_LABELS[reminder.server]}** vient de commencer !`,
    );
  } catch (error) {
    logger.warn({ err: error, reminder }, 'Failed to send reminder DM');
  }
}

async function checkReminders(client: Client, from: Date, to: Date): Promise<void> {
  const reminders = await listAllReminders();
  for (const reminder of reminders) {
    if (isResetDue(reminder.server, reminder.type, from, to)) {
      await notify(client, reminder);
    }
  }
}

// Starts with `lastCheck = now` so resets that already passed before the bot booted
// don't all fire at once on startup.
export function startReminderScheduler(client: Client): void {
  let lastCheck = new Date();

  setInterval(() => {
    const now = new Date();
    const from = lastCheck;
    lastCheck = now;
    void checkReminders(client, from, now);
  }, CHECK_INTERVAL_MS);

  logger.info('Reminder scheduler started');
}
