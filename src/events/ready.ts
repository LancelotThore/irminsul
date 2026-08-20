import type { Client } from 'discord.js';
import { logger } from '../lib/logger.js';
import { startReminderScheduler } from '../lib/scheduler.js';

export function onReady(client: Client<true>): void {
  logger.info(`Logged in as ${client.user.tag}`);
  startReminderScheduler(client);
}
