import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { logger } from './lib/logger.js';
import { commands } from './commands/index.js';
import { onReady } from './events/ready.js';
import { createInteractionHandler } from './events/interactionCreate.js';
import type { Command } from './types/command.js';

runMigrations();

// Last-resort safety net: a single bad Discord API call or unforeseen rejection
// anywhere in the codebase must never take the whole bot down (this happened in
// practice — an expired interaction's fallback error-reply itself throwing, which is
// now fixed at the source in interactionCreate.ts, but this stays as a backstop).
process.on('unhandledRejection', (error: unknown) => {
  logger.error({ err: error }, 'Unhandled rejection');
});

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commandMap = new Collection<string, Command>();
for (const command of commands) {
  commandMap.set(command.data.name, command);
}

const handleInteraction = createInteractionHandler(commandMap);

client.once('ready', onReady);
client.on('interactionCreate', (interaction) => {
  void handleInteraction(interaction);
});

client.login(env.DISCORD_TOKEN).catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to log in to Discord');
  process.exit(1);
});
