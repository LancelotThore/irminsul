import { REST, Routes } from 'discord.js';
import { env } from '../src/config/env.js';
import { logger } from '../src/lib/logger.js';
import { commands } from '../src/commands/index.js';

const body = commands.map((command) => command.data.toJSON());
const rest = new REST().setToken(env.DISCORD_TOKEN);

async function deploy(): Promise<void> {
  const route = env.DISCORD_DEV_GUILD_ID
    ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID)
    : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

  const result = (await rest.put(route, { body })) as unknown[];
  logger.info(`Successfully registered ${result.length} application command(s).`);
}

deploy().catch((error: unknown) => {
  logger.error({ err: error }, 'Failed to deploy commands');
  process.exit(1);
});
