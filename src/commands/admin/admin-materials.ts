import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandSubcommandGroupBuilder,
} from 'discord.js';
import { findCharacterByName } from '../../data/character.repository.js';
import {
  findMaterialByName,
  findMaterialsByCharacterName,
  listAllMaterials,
  listCharacterMaterials,
} from '../../data/materials.repository.js';
import { upsertOverride } from '../../data/overrides.repository.js';
import type {
  CharacterAscensionMaterials,
  CharacterMaterials,
  CharacterTalentMaterials,
  MaterialRef,
} from '../../types/ambr.types.js';

const AUTOCOMPLETE_LIMIT = 25;

type AscensionKey = keyof CharacterAscensionMaterials;
type TalentKey = keyof CharacterTalentMaterials;
type MaterialSlot = `ascension_${AscensionKey}` | `talent_${TalentKey}`;

const SLOT_LABELS: Record<MaterialSlot, string> = {
  ascension_localSpecialty: 'Ascension - Spécialité locale',
  ascension_gem: 'Ascension - Gemme',
  ascension_commonDrop: 'Ascension - Butin commun',
  ascension_bossMaterial: 'Ascension - Matériau de boss',
  talent_commonDrop: 'Talent - Butin commun',
  talent_book: 'Talent - Livre',
  talent_bossMaterial: 'Talent - Matériau de boss hebdomadaire',
  talent_crown: 'Talent - Couronne',
};

function setOrDelete<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  value: T[K] | undefined,
): T {
  const next = { ...obj };
  if (value === undefined) {
    delete next[key];
  } else {
    next[key] = value;
  }
  return next;
}

function applySlot(
  materials: CharacterMaterials,
  slot: MaterialSlot,
  ref: MaterialRef | undefined,
): CharacterMaterials {
  if (slot.startsWith('ascension_')) {
    const key = slot.slice('ascension_'.length) as AscensionKey;
    return { ...materials, ascension: setOrDelete(materials.ascension, key, ref) };
  }
  const key = slot.slice('talent_'.length) as TalentKey;
  return { ...materials, talents: setOrDelete(materials.talents, key, ref) };
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

async function resolveMaterials(characterName: string): Promise<CharacterMaterials | undefined> {
  const existing = await findMaterialsByCharacterName(characterName);
  if (existing) return existing;

  const character = await findCharacterByName(characterName);
  if (!character) return undefined;

  return {
    characterId: character.id,
    characterName: character.name,
    characterIcon: character.icon,
    ascension: {},
    talents: {},
  };
}

async function handleSet(interaction: ChatInputCommandInteraction): Promise<void> {
  const characterName = interaction.options.getString('character', true);
  const slot = interaction.options.getString('slot', true) as MaterialSlot;
  const materialName = interaction.options.getString('material', true);

  const materials = await resolveMaterials(characterName);
  if (!materials) {
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

  const ref: MaterialRef = {
    id: material.id,
    name: material.name,
    icon: material.icon,
    rank: material.rank,
  };

  const updated = applySlot(materials, slot, ref);
  await upsertOverride(
    'character_materials',
    materials.characterId.toString(),
    updated,
    interaction.user.id,
  );
  await interaction.reply({
    content: `"${SLOT_LABELS[slot]}" pour ${materials.characterName} → ${material.name}.`,
    ephemeral: true,
  });
}

async function handleClear(interaction: ChatInputCommandInteraction): Promise<void> {
  const characterName = interaction.options.getString('character', true);
  const slot = interaction.options.getString('slot', true) as MaterialSlot;

  const materials = await resolveMaterials(characterName);
  if (!materials) {
    await interaction.reply({
      content: `Aucun personnage nommé "${characterName}".`,
      ephemeral: true,
    });
    return;
  }

  const updated = applySlot(materials, slot, undefined);
  await upsertOverride(
    'character_materials',
    materials.characterId.toString(),
    updated,
    interaction.user.id,
  );
  await interaction.reply({
    content: `"${SLOT_LABELS[slot]}" retiré pour ${materials.characterName}.`,
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
    const all = await listCharacterMaterials();
    const matches = all
      .filter((m) => m.characterName.toLowerCase().includes(focused))
      .slice(0, AUTOCOMPLETE_LIMIT)
      .map((m) => ({ name: m.characterName, value: m.characterName }));
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
