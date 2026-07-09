import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import { listCharacters } from '../data/character.repository.js';
import type { CharacterFilters } from '../data/character.repository.js';
import { ELEMENT_LABELS, WEAPON_TYPE_LABELS } from '../lib/genshin-labels.js';
import type { GenshinElement } from '../types/ambr.types.js';

const LIST_PREVIEW_LIMIT = 25;

export const characters: Command = {
  data: new SlashCommandBuilder()
    .setName('characters')
    .setDescription('List Genshin Impact characters matching filters')
    .addStringOption((option) =>
      option
        .setName('element')
        .setDescription('Filter by element')
        .setRequired(false)
        .addChoices(...Object.entries(ELEMENT_LABELS).map(([value, name]) => ({ name, value }))),
    )
    .addStringOption((option) =>
      option
        .setName('weapon')
        .setDescription('Filter by weapon type')
        .setRequired(false)
        .addChoices(
          ...Object.entries(WEAPON_TYPE_LABELS).map(([value, name]) => ({ name, value })),
        ),
    )
    .addIntegerOption((option) =>
      option
        .setName('rarity')
        .setDescription('Filter by rarity')
        .setRequired(false)
        .addChoices({ name: '4 étoiles', value: 4 }, { name: '5 étoiles', value: 5 }),
    ),

  async execute(interaction) {
    const element = interaction.options.getString('element') as GenshinElement | null;
    const weaponType = interaction.options.getString('weapon');
    const rank = interaction.options.getInteger('rarity');

    const filters: CharacterFilters = {
      ...(element && { element }),
      ...(weaponType && { weaponType }),
      ...(rank && { rank }),
    };

    if (Object.keys(filters).length === 0) {
      await interaction.reply({
        content: 'Précise au moins un filtre (élément, arme ou rareté).',
        ephemeral: true,
      });
      return;
    }

    const matches = await listCharacters(filters);

    if (matches.length === 0) {
      await interaction.reply({
        content: 'Aucun personnage trouvé pour ces critères.',
        ephemeral: true,
      });
      return;
    }

    const preview = matches
      .slice(0, LIST_PREVIEW_LIMIT)
      .map((c) => c.name)
      .join(', ');
    const suffix =
      matches.length > LIST_PREVIEW_LIMIT ? `, +${matches.length - LIST_PREVIEW_LIMIT} autres` : '';

    await interaction.reply(`**${matches.length} personnage(s)** : ${preview}${suffix}`);
  },
};
