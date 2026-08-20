import type { Collection, Interaction } from 'discord.js';
import { logger } from '../lib/logger.js';
import { isOwner } from '../lib/permissions.js';
import type { Command } from '../types/command.js';

export function createInteractionHandler(
  commands: Collection<string, Command>,
): (interaction: Interaction) => Promise<void> {
  return async function onInteractionCreate(interaction: Interaction): Promise<void> {
    if (interaction.isAutocomplete()) {
      const command = commands.get(interaction.commandName);
      if (!command?.autocomplete) return;

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        logger.error({ err: error, command: interaction.commandName }, 'Autocomplete failed');
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`Unknown command received: ${interaction.commandName}`);
      return;
    }

    if (command.ownerOnly && !isOwner(interaction.user.id)) {
      await interaction.reply({
        content: "Tu n'es pas autorisé à utiliser cette commande.",
        ephemeral: true,
      });
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
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch (replyError) {
        // The interaction itself is gone (e.g. it expired past Discord's response
        // window) — nothing more we can do, but this must never throw uncaught: an
        // unhandled rejection here would crash the whole bot process over one bad
        // interaction, taking down every other in-flight command with it.
        logger.error(
          { err: replyError, command: interaction.commandName },
          'Failed to report command failure back to Discord',
        );
      }
    }
  };
}
