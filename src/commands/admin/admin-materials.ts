import { eq, sql } from 'drizzle-orm';
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { normalizeCharacterName } from '../../data/gazette-build.repository.js';
import {
  findMaterialsGuideByCharacterName,
  listMaterialsGuides,
} from '../../data/materials.repository.js';
import { db } from '../../db/client.js';
import { materialsGuides } from '../../db/schema.js';

const AUTOCOMPLETE_LIMIT = 25;

export function buildMaterialsGroup(
  group: SlashCommandSubcommandGroupBuilder,
): SlashCommandSubcommandGroupBuilder {
  return group
    .setName('materials')
    .setDescription('Ajoute, modifie ou supprime un guide de matériaux')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Ajoute un guide de matériaux')
        .addStringOption((o) =>
          o.setName('name').setDescription('Nom du personnage').setRequired(true),
        )
        .addStringOption((o) =>
          o.setName('image').setDescription("URL de l'image du guide").setRequired(true),
        )
        .addStringOption((o) =>
          o.setName('page').setDescription('URL de la page du guide').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Modifie un guide de matériaux existant')
        .addStringOption((o) =>
          o.setName('name').setDescription('Personnage').setRequired(true).setAutocomplete(true),
        )
        .addStringOption((o) =>
          o.setName('image').setDescription("Nouvelle URL de l'image").setRequired(false),
        )
        .addStringOption((o) =>
          o.setName('page').setDescription('Nouvelle URL de la page').setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Supprime un guide de matériaux')
        .addStringOption((o) =>
          o.setName('name').setDescription('Personnage').setRequired(true).setAutocomplete(true),
        ),
    );
}

function slugify(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

async function handleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString('name', true);
  const imageUrl = interaction.options.getString('image', true);
  const pageUrl = interaction.options.getString('page', true);

  const existing = await findMaterialsGuideByCharacterName(name);
  if (existing) {
    await interaction.reply({
      content: `Un guide existe déjà pour "${name}" (utilise \`/admin materials edit\`).`,
      ephemeral: true,
    });
    return;
  }

  await db.insert(materialsGuides).values({
    characterKey: normalizeCharacterName(name),
    slug: slugify(name),
    name,
    imageUrl,
    pageUrl,
    source: 'admin',
    locked: true,
    updatedBy: interaction.user.id,
  });
  await interaction.reply({ content: `Guide de matériaux "${name}" ajouté.`, ephemeral: true });
}

async function handleEdit(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString('name', true);
  const found = await findMaterialsGuideByCharacterName(name);
  if (!found) {
    await interaction.reply({ content: `Aucun guide trouvé pour "${name}".`, ephemeral: true });
    return;
  }

  const imageUrl = interaction.options.getString('image');
  const pageUrl = interaction.options.getString('page');

  await db
    .update(materialsGuides)
    .set({
      ...(imageUrl && { imageUrl }),
      ...(pageUrl && { pageUrl }),
      source: 'admin',
      locked: true,
      updatedBy: interaction.user.id,
      updatedAt: sql`(current_timestamp)`,
    })
    .where(eq(materialsGuides.characterKey, normalizeCharacterName(found.name)));
  await interaction.reply({
    content: `Guide de matériaux "${found.name}" modifié.`,
    ephemeral: true,
  });
}

async function handleDelete(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString('name', true);
  const found = await findMaterialsGuideByCharacterName(name);
  if (!found) {
    await interaction.reply({ content: `Aucun guide trouvé pour "${name}".`, ephemeral: true });
    return;
  }

  await db
    .update(materialsGuides)
    .set({
      hidden: true,
      locked: true,
      updatedBy: interaction.user.id,
      updatedAt: sql`(current_timestamp)`,
    })
    .where(eq(materialsGuides.characterKey, normalizeCharacterName(found.name)));
  await interaction.reply({
    content: `Guide de matériaux "${found.name}" supprimé.`,
    ephemeral: true,
  });
}

export async function handleMaterialsSubcommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand === 'add') return handleAdd(interaction);
  if (subcommand === 'edit') return handleEdit(interaction);
  if (subcommand === 'delete') return handleDelete(interaction);
}

export async function autocompleteMaterialsOption(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused().toLowerCase();
  const guides = await listMaterialsGuides();

  const matches = guides
    .filter((g) => g.name.toLowerCase().includes(focused))
    .slice(0, AUTOCOMPLETE_LIMIT)
    .map((g) => ({ name: g.name, value: g.name }));

  await interaction.respond(matches);
}
