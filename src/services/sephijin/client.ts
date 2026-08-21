const BASE_URL = 'https://sephijin.fr';
const LISTING_URL = `${BASE_URL}/genshin-impact-personnages/`;
const USER_AGENT = 'irminsul-discord-bot/0.1.0';

const SLUG_LINK_PATTERN = /href="https:\/\/sephijin\.fr\/([a-z0-9-]+)\/"/g;
const TITLE_PATTERN = /<title>([^<]+)<\/title>/;
// The site covers other games (Honkai: Star Rail, Wuthering Waves) and has nav/category
// pages that happen to match the same /slug/ URL shape as a character page — rather than
// maintaining a blocklist of those, this image is only present on actual character pages
// that have a farm guide, so its absence (handled in fetchCharacterMaterialsGuide below)
// already filters both non-character pages and characters without a guide yet.
const MATERIALS_IMAGE_PATTERN =
  /https:\/\/sephijin\.fr\/wp-content\/uploads\/[^"'\s]*guide-farm-materiaux[^"'\s]*\.(?:webp|png|jpe?g)/i;

export interface SephijinMaterialsGuidePage {
  slug: string;
  name: string;
  imageUrl: string;
  pageUrl: string;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Sephijin request failed: ${res.status} ${res.statusText} (${url})`);
  }
  return res.text();
}

export async function fetchCharacterSlugs(): Promise<string[]> {
  const html = await fetchHtml(LISTING_URL);
  const slugs = [...html.matchAll(SLUG_LINK_PATTERN)].map((match) => match[1]);
  return [...new Set(slugs)].filter((slug): slug is string => slug !== undefined);
}

// Most characters don't have this guide yet (the site is still filling out its roster) —
// returns undefined in that case, same as the Gazette client does for missing builds.
export async function fetchCharacterMaterialsGuide(
  slug: string,
): Promise<SephijinMaterialsGuidePage | undefined> {
  const pageUrl = `${BASE_URL}/${slug}/`;
  const html = await fetchHtml(pageUrl);

  const title = html.match(TITLE_PATTERN)?.[1];
  const name = title?.split(' :')[0]?.trim();
  const imageUrl = html.match(MATERIALS_IMAGE_PATTERN)?.[0];

  if (!name || !imageUrl) return undefined;

  return { slug, name, imageUrl, pageUrl };
}
