import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import type { GenshinServer } from '../lib/genshin-servers.js';
import { SERVER_LABELS } from '../lib/genshin-servers.js';
import { nextDailyReset, nextWeeklyReset } from '../lib/reset-times.js';

const ALL_SERVERS: GenshinServer[] = ['asia', 'europe', 'america'];

function toDiscordTimestamp(date: Date): string {
  const seconds = Math.floor(date.getTime() / 1000);
  return `<t:${seconds}:F> (<t:${seconds}:R>)`;
}

function buildServerLine(server: GenshinServer): string {
  const daily = toDiscordTimestamp(nextDailyReset(server));
  const weekly = toDiscordTimestamp(nextWeeklyReset(server));
  return (
    `**${SERVER_LABELS[server]}**\n` +
    `Reset journalier : ${daily}\n` +
    `Reset hebdomadaire : ${weekly}`
  );
}

export const reset: Command = {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Show the next daily and weekly reset time for a Genshin Impact server')
    .addStringOption((option) =>
      option
        .setName('server')
        .setDescription('Server region')
        .setRequired(false)
        .addChoices(
          { name: 'Asie', value: 'asia' },
          { name: 'Europe', value: 'europe' },
          { name: 'Amérique', value: 'america' },
        ),
    ),

  async execute(interaction) {
    const server = interaction.options.getString('server') as GenshinServer | null;
    const servers = server ? [server] : ALL_SERVERS;
    await interaction.reply({
      content: servers.map(buildServerLine).join('\n\n'),
      ephemeral: true,
    });
  },
};
