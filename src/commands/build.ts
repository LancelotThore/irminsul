import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import { listCharacters } from '../data/character.repository.js';
import {
  findBuildByCharacterName,
  listGazetteBuilds,
  normalizeCharacterName,
} from '../data/gazette-build.repository.js';
import { buildBuildEmbed } from '../embeds/build.embed.js';

const AUTOCOMPLETE_LIMIT = 25;

export const build: Command = {
  data: new SlashCommandBuilder()
    .setName('build')
    .setDescription('Show a recommended build for a Genshin Impact character')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('Character name')
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name', true);
    const found = await findBuildByCharacterName(name);

    if (!found) {
      await interaction.reply({
        content: `Aucun guide de build trouvé pour "${name}".`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({ embeds: [buildBuildEmbed(found)] });
  },

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const [characters, builds] = await Promise.all([listCharacters(), listGazetteBuilds()]);
    const buildNames = new Set(builds.map((b) => normalizeCharacterName(b.name)));

    const seenNames = new Set<string>();
    const matches: { name: string; value: string }[] = [];
    for (const candidate of characters) {
      if (!buildNames.has(normalizeCharacterName(candidate.name))) continue;
      const key = candidate.name.toLowerCase();
      if (!key.includes(focused) || seenNames.has(key)) continue;
      seenNames.add(key);
      matches.push({ name: candidate.name, value: candidate.name });
      if (matches.length >= AUTOCOMPLETE_LIMIT) break;
    }

    await interaction.respond(matches);
  },
};
