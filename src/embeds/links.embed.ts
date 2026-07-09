import { EmbedBuilder } from 'discord.js';
import { USEFUL_LINKS } from '../lib/useful-links.js';

export function buildLinksEmbed(): EmbedBuilder {
  const embed = new EmbedBuilder().setTitle('Liens utiles').setColor(0x1a1a2e);

  for (const link of USEFUL_LINKS) {
    embed.addFields({
      name: `${link.emoji} ${link.label}`,
      value: `${link.description}\n[Ouvrir ↗](${link.url})`,
    });
  }

  return embed;
}
