import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { findCharacterByName, listCharacters } from '../../data/character.repository.js';
import { upsertOverride, deleteOverride } from '../../data/overrides.repository.js';
import { ELEMENT_LABELS, NATION_LABELS, WEAPON_TYPE_LABELS } from '../../lib/genshin-labels.js';
import type { AmbrCharacterSummary, GenshinElement } from '../../types/ambr.types.js';

const AUTOCOMPLETE_LIMIT = 25;

export function buildCharacterGroup(
  group: SlashCommandSubcommandGroupBuilder,
): SlashCommandSubcommandGroupBuilder {
  return group
    .setName('character')
    .setDescription('Ajoute, modifie ou supprime un personnage')
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Ajoute un nouveau personnage')
        .addIntegerOption((o) => o.setName('id').setDescription('ID Ambr').setRequired(true))
        .addStringOption((o) => o.setName('name').setDescription('Nom').setRequired(true))
        .addIntegerOption((o) =>
          o
            .setName('rarity')
            .setDescription('Rareté')
            .setRequired(true)
            .addChoices({ name: '4 étoiles', value: 4 }, { name: '5 étoiles', value: 5 }),
        )
        .addStringOption((o) =>
          o
            .setName('element')
            .setDescription('Élément')
            .setRequired(true)
            .addChoices(
              ...Object.entries(ELEMENT_LABELS).map(([value, name]) => ({ name, value })),
            ),
        )
        .addStringOption((o) =>
          o
            .setName('weapon')
            .setDescription('Type d’arme')
            .setRequired(true)
            .addChoices(
              ...Object.entries(WEAPON_TYPE_LABELS).map(([value, name]) => ({ name, value })),
            ),
        )
        .addStringOption((o) =>
          o
            .setName('icon')
            .setDescription('Slug icône Ambr (ex: UI_AvatarIcon_Aino)')
            .setRequired(true),
        )
        .addStringOption((o) =>
          o
            .setName('region')
            .setDescription('Nation')
            .setRequired(false)
            .addChoices(...Object.entries(NATION_LABELS).map(([value, name]) => ({ name, value }))),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Modifie un personnage existant')
        .addStringOption((o) =>
          o
            .setName('name')
            .setDescription('Personnage à modifier')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((o) =>
          o.setName('newname').setDescription('Nouveau nom').setRequired(false),
        )
        .addIntegerOption((o) =>
          o
            .setName('rarity')
            .setDescription('Rareté')
            .setRequired(false)
            .addChoices({ name: '4 étoiles', value: 4 }, { name: '5 étoiles', value: 5 }),
        )
        .addStringOption((o) =>
          o
            .setName('element')
            .setDescription('Élément')
            .setRequired(false)
            .addChoices(
              ...Object.entries(ELEMENT_LABELS).map(([value, name]) => ({ name, value })),
            ),
        )
        .addStringOption((o) =>
          o
            .setName('weapon')
            .setDescription('Type d’arme')
            .setRequired(false)
            .addChoices(
              ...Object.entries(WEAPON_TYPE_LABELS).map(([value, name]) => ({ name, value })),
            ),
        )
        .addStringOption((o) =>
          o.setName('icon').setDescription('Slug icône Ambr').setRequired(false),
        )
        .addStringOption((o) =>
          o
            .setName('region')
            .setDescription('Nation')
            .setRequired(false)
            .addChoices(...Object.entries(NATION_LABELS).map(([value, name]) => ({ name, value }))),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Supprime un personnage')
        .addStringOption((o) =>
          o
            .setName('name')
            .setDescription('Personnage à supprimer')
            .setRequired(true)
            .setAutocomplete(true),
        ),
    );
}

async function handleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
  const id = interaction.options.getInteger('id', true);
  const name = interaction.options.getString('name', true);
  const rank = interaction.options.getInteger('rarity', true);
  const element = interaction.options.getString('element', true) as GenshinElement;
  const weaponType = interaction.options.getString('weapon', true);
  const icon = interaction.options.getString('icon', true);
  const region = interaction.options.getString('region');

  const existing = await findCharacterByName(name);
  if (existing) {
    await interaction.reply({
      content: `"${name}" existe déjà (utilise \`/admin character edit\`).`,
      ephemeral: true,
    });
    return;
  }

  const record: AmbrCharacterSummary = {
    id,
    rank,
    name,
    element,
    weaponType,
    icon,
    ...(region && { region }),
  };

  await upsertOverride('character', id.toString(), record, interaction.user.id);
  await interaction.reply({ content: `Personnage "${name}" ajouté.`, ephemeral: true });
}

async function handleEdit(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString('name', true);
  const found = await findCharacterByName(name);
  if (!found) {
    await interaction.reply({ content: `Aucun personnage nommé "${name}".`, ephemeral: true });
    return;
  }

  const newName = interaction.options.getString('newname');
  const rank = interaction.options.getInteger('rarity');
  const element = interaction.options.getString('element') as GenshinElement | null;
  const weaponType = interaction.options.getString('weapon');
  const icon = interaction.options.getString('icon');
  const region = interaction.options.getString('region');

  const record: AmbrCharacterSummary = {
    ...found,
    ...(newName && { name: newName }),
    ...(rank && { rank }),
    ...(element && { element }),
    ...(weaponType && { weaponType }),
    ...(icon && { icon }),
    ...(region && { region }),
  };

  await upsertOverride('character', found.id.toString(), record, interaction.user.id);
  await interaction.reply({ content: `Personnage "${found.name}" modifié.`, ephemeral: true });
}

async function handleDelete(interaction: ChatInputCommandInteraction): Promise<void> {
  const name = interaction.options.getString('name', true);
  const found = await findCharacterByName(name);
  if (!found) {
    await interaction.reply({ content: `Aucun personnage nommé "${name}".`, ephemeral: true });
    return;
  }

  await deleteOverride('character', found.id.toString(), interaction.user.id);
  await interaction.reply({ content: `Personnage "${found.name}" supprimé.`, ephemeral: true });
}

export async function handleCharacterSubcommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand === 'add') return handleAdd(interaction);
  if (subcommand === 'edit') return handleEdit(interaction);
  if (subcommand === 'delete') return handleDelete(interaction);
}

export async function autocompleteCharacterName(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focused = interaction.options.getFocused().toLowerCase();
  const characters = await listCharacters();

  const matches = characters
    .filter((c) => c.name.toLowerCase().includes(focused))
    .slice(0, AUTOCOMPLETE_LIMIT)
    .map((c) => ({ name: c.name, value: c.name }));

  await interaction.respond(matches);
}
