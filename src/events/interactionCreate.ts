import type { Collection, Interaction } from 'discord.js';
import { logger } from '../lib/logger.js';
import type { Command } from '../types/command.js';

export function createInteractionHandler(
  commands: Collection<string, Command>,
): (interaction: Interaction) => Promise<void> {
  return async function onInteractionCreate(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown command received: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      logger.error({ err: error, command: interaction.commandName }, 'Command execution failed');
      const payload = {
        content: "Une erreur est survenue lors de l'exécution de la commande.",
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  };
}
