import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import {
  findMaterialsByCharacterName,
  listCharacterMaterials,
} from '../data/materials.repository.js';
import { buildMaterialsEmbed } from '../embeds/materials.embed.js';

const AUTOCOMPLETE_LIMIT = 25;

export const materials: Command = {
  data: new SlashCommandBuilder()
    .setName('materials')
    .setDescription('Show what to farm to fully ascend and upgrade a character')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Character name')
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name', true);
    const found = await findMaterialsByCharacterName(name);

    if (!found) {
      await interaction.reply({
        content: `Aucune donnée de matériaux trouvée pour "${name}".`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({ embeds: [buildMaterialsEmbed(found)] });
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const all = await listCharacterMaterials();

    const seenNames = new Set<string>();
    const matches: { name: string; value: string }[] = [];
    for (const candidate of all) {
      const key = candidate.characterName.toLowerCase();
      if (!key.includes(focused) || seenNames.has(key)) continue;
      seenNames.add(key);
      matches.push({ name: candidate.characterName, value: candidate.characterName });
      if (matches.length >= AUTOCOMPLETE_LIMIT) break;
    }

    await interaction.respond(matches);
  },
};
