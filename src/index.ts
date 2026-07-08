import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { commands } from './commands/index.js';
import { onReady } from './events/ready.js';
import { createInteractionHandler } from './events/interactionCreate.js';
import type { Command } from './types/command.js';

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
