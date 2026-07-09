import { EmbedBuilder } from 'discord.js';
import { ambrIconUrl } from '../services/ambr/client.js';
import type { CharacterMaterials, MaterialRef } from '../types/ambr.types.js';

function formatSection(materials: (MaterialRef | undefined)[]): string {
  const names = materials.filter((material): material is MaterialRef => material !== undefined);
  return names.length > 0 ? names.map((material) => material.name).join('\n') : 'Aucune donnée';
}

export function buildMaterialsEmbed(materials: CharacterMaterials): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`Matériaux à farmer : ${materials.characterName}`)
    .setThumbnail(ambrIconUrl(materials.characterIcon))
    .setColor(0x1a1a2e)
    .addFields(
      {
        name: 'Ascension',
        value: formatSection([
          materials.ascension.localSpecialty,
          materials.ascension.gem,
          materials.ascension.commonDrop,
          materials.ascension.bossMaterial,
        ]),
        inline: true,
      },
      {
        name: 'Talents',
        value: formatSection([
          materials.talents.book,
          materials.talents.commonDrop,
          materials.talents.bossMaterial,
          materials.talents.crown,
        ]),
        inline: true,
      },
    )
    .setFooter({ text: 'Source : Ambr (Project Amber)' });
}
