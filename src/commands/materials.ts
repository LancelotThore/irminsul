import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import { listCharacters } from '../data/character.repository.js';
import {
  findMaterialsGuideByCharacterName,
  listMaterialsGuides,
} from '../data/materials.repository.js';
import { normalizeCharacterName } from '../data/gazette-build.repository.js';
import { buildMaterialsEmbed } from '../embeds/materials.embed.js';

const AUTOCOMPLETE_LIMIT = 25;

export const materials: Command = {
  data: new SlashCommandBuilder()
    .setName('materials')
    .setDescription('Show the farming materials guide for a Genshin Impact character')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Character name')
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name', true);
    const found = await findMaterialsGuideByCharacterName(name);

    if (!found) {
      await interaction.reply({
        content: `Aucun guide de matériaux trouvé pour "${name}".`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({ embeds: [buildMaterialsEmbed(found)] });
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const [characters, guides] = await Promise.all([listCharacters(), listMaterialsGuides()]);
    const guideNames = new Set(guides.map((g) => normalizeCharacterName(g.name)));

    const seenNames = new Set<string>();
    const matches: { name: string; value: string }[] = [];
    for (const candidate of characters) {
      if (!guideNames.has(normalizeCharacterName(candidate.name))) continue;
      const key = candidate.name.toLowerCase();
      if (!key.includes(focused) || seenNames.has(key)) continue;
      seenNames.add(key);
      matches.push({ name: candidate.name, value: candidate.name });
      if (matches.length >= AUTOCOMPLETE_LIMIT) break;
    }

    await interaction.respond(matches);
  },
};
