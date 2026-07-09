import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import { findCharacterByName, listCharacters } from '../data/character.repository.js';
import { buildCharacterEmbed } from '../embeds/character.embed.js';

const AUTOCOMPLETE_LIMIT = 25;

export const character: Command = {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('Look up a Genshin Impact character')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Character name')
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name', true);
    const found = await findCharacterByName(name);

    if (!found) {
      await interaction.reply({
        content: `Aucun personnage trouvé pour "${name}".`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({ embeds: [buildCharacterEmbed(found)] });
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const characters = await listCharacters();

    const seenNames = new Set<string>();
    const matches: { name: string; value: string }[] = [];
    for (const candidate of characters) {
      const key = candidate.name.toLowerCase();
      if (!key.includes(focused) || seenNames.has(key)) continue;
      seenNames.add(key);
      matches.push({ name: candidate.name, value: candidate.name });
      if (matches.length >= AUTOCOMPLETE_LIMIT) break;
    }

    await interaction.respond(matches);
  },
};
