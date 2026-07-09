import { EmbedBuilder } from 'discord.js';
import type { GazetteBuild } from '../data/gazette-build.repository.js';

export function buildBuildEmbed(build: GazetteBuild): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle(`Build : ${build.name}`)
    .setURL(build.pageUrl)
    .setImage(build.imageUrl)
    .setColor(0x1a1a2e)
    .setFooter({ text: 'Source : La Gazette de Teyvat' });
}
