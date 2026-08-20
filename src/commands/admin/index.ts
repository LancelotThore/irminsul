import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command.js';
import { autocompleteBuildName, buildBuildGroup, handleBuildSubcommand } from './admin-build.js';
import {
  autocompleteCharacterName,
  buildCharacterGroup,
  handleCharacterSubcommand,
} from './admin-character.js';
import {
  autocompleteMaterialsOption,
  buildMaterialsGroup,
  handleMaterialsSubcommand,
} from './admin-materials.js';

export const admin: Command = {
  ownerOnly: true,
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Édite les données de jeu (owner uniquement)')
    .setDefaultMemberPermissions(0)
    .addSubcommandGroup(buildCharacterGroup)
    .addSubcommandGroup(buildBuildGroup)
    .addSubcommandGroup(buildMaterialsGroup),

  async execute(interaction) {
    const group = interaction.options.getSubcommandGroup(true);
    switch (group) {
      case 'character':
        return handleCharacterSubcommand(interaction);
      case 'build':
        return handleBuildSubcommand(interaction);
      case 'materials':
        return handleMaterialsSubcommand(interaction);
      default:
        return;
    }
  },

  async autocomplete(interaction) {
    const group = interaction.options.getSubcommandGroup();
    switch (group) {
      case 'character':
        return autocompleteCharacterName(interaction);
      case 'build':
        return autocompleteBuildName(interaction);
      case 'materials':
        return autocompleteMaterialsOption(interaction);
      default:
        await interaction.respond([]);
    }
  },
};
