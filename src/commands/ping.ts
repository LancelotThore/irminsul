import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';

export const ping: Command = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check if the bot is online'),
  async execute(interaction) {
    const sentAt = Date.now();
    await interaction.reply('Pong !');
    const latency = Date.now() - sentAt;
    await interaction.editReply(`Pong ! (${latency}ms)`);
  },
};
