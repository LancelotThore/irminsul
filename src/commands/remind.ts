import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../types/command.js';
import { addReminder, listRemindersForUser, removeReminder } from '../data/reminders.repository.js';
import type { ReminderType } from '../data/reminders.repository.js';
import { SERVER_LABELS } from '../lib/genshin-servers.js';
import type { GenshinServer } from '../lib/genshin-servers.js';

const TYPE_LABELS: Record<ReminderType, string> = {
  daily: 'journalier',
  weekly: 'hebdomadaire',
};

const SERVER_CHOICES = Object.entries(SERVER_LABELS).map(([value, name]) => ({ name, value }));
const TYPE_CHOICES = Object.entries(TYPE_LABELS).map(([value, name]) => ({ name, value }));

export const remind: Command = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Gère tes rappels de reset (envoyés en message privé)')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Ajoute un rappel de reset')
        .addStringOption((o) =>
          o
            .setName('server')
            .setDescription('Serveur')
            .setRequired(true)
            .addChoices(...SERVER_CHOICES),
        )
        .addStringOption((o) =>
          o
            .setName('type')
            .setDescription('Type de reset')
            .setRequired(true)
            .addChoices(...TYPE_CHOICES),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Supprime un rappel de reset')
        .addStringOption((o) =>
          o
            .setName('server')
            .setDescription('Serveur')
            .setRequired(true)
            .addChoices(...SERVER_CHOICES),
        )
        .addStringOption((o) =>
          o
            .setName('type')
            .setDescription('Type de reset')
            .setRequired(true)
            .addChoices(...TYPE_CHOICES),
        ),
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('Liste tes rappels actifs')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand(true);

    if (subcommand === 'add') {
      const server = interaction.options.getString('server', true) as GenshinServer;
      const type = interaction.options.getString('type', true) as ReminderType;
      await addReminder(interaction.user.id, server, type);
      await interaction.reply({
        content: `Rappel ajouté : reset ${TYPE_LABELS[type]} (${SERVER_LABELS[server]}).`,
        ephemeral: true,
      });
      return;
    }

    if (subcommand === 'remove') {
      const server = interaction.options.getString('server', true) as GenshinServer;
      const type = interaction.options.getString('type', true) as ReminderType;
      const removed = await removeReminder(interaction.user.id, server, type);
      await interaction.reply({
        content: removed
          ? `Rappel supprimé : reset ${TYPE_LABELS[type]} (${SERVER_LABELS[server]}).`
          : "Ce rappel n'existe pas.",
        ephemeral: true,
      });
      return;
    }

    const reminders = await listRemindersForUser(interaction.user.id);
    if (reminders.length === 0) {
      await interaction.reply({ content: "Tu n'as aucun rappel actif.", ephemeral: true });
      return;
    }

    const lines = reminders.map(
      (r) => `- Reset ${TYPE_LABELS[r.type]} (${SERVER_LABELS[r.server]})`,
    );
    await interaction.reply({ content: lines.join('\n'), ephemeral: true });
  },
};
