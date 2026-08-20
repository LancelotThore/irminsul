import { and, eq, sql } from 'drizzle-orm';
import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { findCharacterByName, listCharacters } from '../../data/character.repository.js';
import {
  findMaterialByName,
  findMaterialsByCharacterName,
  listAllMaterials,
} from '../../data/materials.repository.js';
import { db } from '../../db/client.js';
import { characterMaterialSlots } from '../../db/schema.js';
import { SLOT_LABELS } from '../../lib/material-slots.js';
import type { MaterialSlot } from '../../lib/material-slots.js';

const AUTOCOMPLETE_LIMIT = 25;

function getSlotValue(
  materials: Awaited<ReturnType<typeof findMaterialsByCharacterName>>,
  slot: MaterialSlot,
) {
  if (!materials) return undefined;
  return slot.startsWith('ascension_')
    ? materials.ascension[slot.slice('ascension_'.length) as keyof typeof materials.ascension]
    : materials.talents[slot.slice('talent_'.length) as keyof typeof materials.talents];
}

export function buildMaterialsGroup(
  group: SlashCommandSubcommandGroupBuilder,
): SlashCommandSubcommandGroupBuilder {
  return group
    .setName('materials')
    .setDescription("Édite les matériaux d'un personnage")
    .addSubcommand((sub) =>
      sub
        .setName('set')
        .setDescription("Assigne un matériau à un emplacement d'ascension/talent")
        .addStringOption((o) =>
          o
            .setName('character')
            .setDescription('Personnage')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((o) =>
          o
            .setName('slot')
            .setDescription('Emplacement')
            .setRequired(true)
            .addChoices(...Object.entries(SLOT_LABELS).map(([value, name]) => ({ name, value }))),
        )
        .addStringOption((o) =>
          o.setName('material').setDescription('Matériau').setRequired(true).setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear')
        .setDescription("Retire le matériau d'un emplacement")
        .addStringOption((o) =>
          o
            .setName('character')
            .setDescription('Personnage')
            .setRequired(true)
            .setAutocomplete(true),
        )
        .addStringOption((o) =>
          o
            .setName('slot')
            .setDescription('Emplacement')
            .setRequired(true)
            .addChoices(...Object.entries(SLOT_LABELS).map(([value, name]) => ({ name, value }))),
        ),
    );
}

async function handleSet(interaction: ChatInputCommandInteraction): Promise<void> {
  const characterName = interaction.options.getString('character', true);
  const slot = interaction.options.getString('slot', true) as MaterialSlot;
  const materialName = interaction.options.getString('material', true);

  const character = await findCharacterByName(characterName);
  if (!character) {
    await interaction.reply({
      content: `Aucun personnage nommé "${characterName}".`,
      ephemeral: true,
    });
    return;
  }

  const material = await findMaterialByName(materialName);
  if (!material) {
    await interaction.reply({
      content: `Aucun matériau nommé "${materialName}".`,
      ephemeral: true,
    });
    return;
  }
  if (material.rank === undefined) {
    await interaction.reply({
      content: `"${material.name}" n'a pas de rareté connue, impossible de l'utiliser ici.`,
      ephemeral: true,
    });
    return;
  }

  await db
    .insert(characterMaterialSlots)
    .values({
      characterId: character.id,
      slot,
      materialId: material.id,
      source: 'admin',
      locked: true,
      updatedBy: interaction.user.id,
    })
    .onConflictDoUpdate({
      target: [characterMaterialSlots.characterId, characterMaterialSlots.slot],
      set: {
        materialId: material.id,
        hidden: false,
        source: 'admin',
        locked: true,
        updatedBy: interaction.user.id,
        updatedAt: sql`(current_timestamp)`,
      },
    });
  await interaction.reply({
    content: `"${SLOT_LABELS[slot]}" pour ${character.name} → ${material.name}.`,
    ephemeral: true,
  });
}

async function handleClear(interaction: ChatInputCommandInteraction): Promise<void> {
  const characterName = interaction.options.getString('character', true);
  const slot = interaction.options.getString('slot', true) as MaterialSlot;

  const character = await findCharacterByName(characterName);
  if (!character) {
    await interaction.reply({
      content: `Aucun personnage nommé "${characterName}".`,
      ephemeral: true,
    });
    return;
  }

  const currentMaterials = await findMaterialsByCharacterName(characterName);
  if (!getSlotValue(currentMaterials, slot)) {
    await interaction.reply({
      content: `"${SLOT_LABELS[slot]}" est déjà vide pour ${character.name}.`,
      ephemeral: true,
    });
    return;
  }

  await db
    .update(characterMaterialSlots)
    .set({
      hidden: true,
      locked: true,
      updatedBy: interaction.user.id,
      updatedAt: sql`(current_timestamp)`,
    })
    .where(
      and(
        eq(characterMaterialSlots.characterId, character.id),
        eq(characterMaterialSlots.slot, slot),
      ),
    );
  await interaction.reply({
    content: `"${SLOT_LABELS[slot]}" retiré pour ${character.name}.`,
    ephemeral: true,
  });
}

export async function handleMaterialsSubcommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const subcommand = interaction.options.getSubcommand(true);
  if (subcommand === 'set') return handleSet(interaction);
  if (subcommand === 'clear') return handleClear(interaction);
}

export async function autocompleteMaterialsOption(
  interaction: AutocompleteInteraction,
): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);
  const focused = focusedOption.value.toLowerCase();

  if (focusedOption.name === 'character') {
    // Any character can receive a material slot, not just ones that already have one
    // (e.g. a freshly admin-added character has none yet) — so this suggests from the
    // full character list rather than only characters with existing slots.
    const all = await listCharacters();
    const matches = all
      .filter((c) => c.name.toLowerCase().includes(focused))
      .slice(0, AUTOCOMPLETE_LIMIT)
      .map((c) => ({ name: c.name, value: c.name }));
    await interaction.respond(matches);
    return;
  }

  if (focusedOption.name === 'material') {
    const all = await listAllMaterials();
    const matches = all
      .filter((m) => m.name.toLowerCase().includes(focused))
      .slice(0, AUTOCOMPLETE_LIMIT)
      .map((m) => ({ name: m.name, value: m.name }));
    await interaction.respond(matches);
    return;
  }

  await interaction.respond([]);
}
