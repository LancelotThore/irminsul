import { EmbedBuilder } from 'discord.js';
import { ambrIconUrl } from '../services/ambr/client.js';
import { ELEMENT_LABELS, NATION_LABELS, WEAPON_TYPE_LABELS } from '../lib/genshin-labels.js';
import type { AmbrCharacterSummary } from '../types/ambr.types.js';

export function buildCharacterEmbed(character: AmbrCharacterSummary): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${character.name} ${'⭐'.repeat(character.rank)}`)
    .setThumbnail(ambrIconUrl(character.icon))
    .setColor(0x1a1a2e)
    .addFields(
      { name: 'Élément', value: ELEMENT_LABELS[character.element], inline: true },
      {
        name: 'Arme',
        value: WEAPON_TYPE_LABELS[character.weaponType] ?? character.weaponType,
        inline: true,
      },
    )
    .setFooter({ text: 'Source : Ambr (Project Amber)' });

  const nationLabel = character.region ? NATION_LABELS[character.region] : undefined;
  if (nationLabel) {
    embed.addFields({ name: 'Nation', value: nationLabel, inline: true });
  }

  return embed;
}
