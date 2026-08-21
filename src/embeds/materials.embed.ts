import { EmbedBuilder } from 'discord.js';
import type { MaterialsGuide } from '../data/materials.repository.js';

export function buildMaterialsEmbed(guide: MaterialsGuide): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`Matériaux à farmer : ${guide.name}`)
    .setURL(guide.pageUrl)
    .setImage(guide.imageUrl)
    .setColor(0x1a1a2e)
    .setFooter({ text: 'Source : Sephijin' });
}
