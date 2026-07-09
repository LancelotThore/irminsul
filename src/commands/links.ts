import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import { buildLinksEmbed } from '../embeds/links.embed.js';
import { USEFUL_LINKS } from '../lib/useful-links.js';

export const links: Command = {
  data: new SlashCommandBuilder()
    .setName('links')
    .setDescription('Show useful Genshin Impact resources')
    .addStringOption((option) =>
      option
        .setName('site')
        .setDescription('Show only one specific resource')
        .setRequired(false)
        .addChoices(...USEFUL_LINKS.map((link) => ({ name: link.label, value: link.id }))),
    ),

  async execute(interaction) {
    const siteId = interaction.options.getString('site');

    if (!siteId) {
      await interaction.reply({ embeds: [buildLinksEmbed()] });
      return;
    }

    const link = USEFUL_LINKS.find((candidate) => candidate.id === siteId);
    if (!link) {
      await interaction.reply({ content: 'Lien introuvable.', ephemeral: true });
      return;
    }

    await interaction.reply({
      content: `${link.emoji} **${link.label}**\n${link.description}\n${link.url}`,
      ephemeral: true,
    });
  },
};
