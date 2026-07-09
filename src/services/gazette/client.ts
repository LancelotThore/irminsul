const BASE_URL = 'https://lagazettedeteyvat.fr';
const LISTING_URL = `${BASE_URL}/personnages/`;
const USER_AGENT = 'irminsul-discord-bot/0.1.0';

const SLUG_LINK_PATTERN = /href="https:\/\/lagazettedeteyvat\.fr\/personnages\/([a-z0-9-]+)\/"/g;
const TITLE_PATTERN = /<title>([^<]+)<\/title>/;
const IMAGE_SRC_PATTERN =
  /src="(https:\/\/lagazettedeteyvat\.fr\/wp-content\/uploads\/[^"]+\.(?:webp|png|jpe?g))"/gi;

// Some page titles use a non-breaking space (code point 160) instead of a regular space
// before "build". Built via String.fromCharCode rather than a literal escape sequence,
// since this source file cannot reliably keep either a raw irregular-whitespace byte or a
// literal backslash-u escape intact through editing.
const NON_BREAKING_SPACE_PATTERN = new RegExp(String.fromCharCode(160), 'g');

export interface GazetteBuildPage {
  slug: string;
  name: string;
  imageUrl: string;
  pageUrl: string;
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Gazette request failed: ${res.status} ${res.statusText} (${url})`);
  }
  return res.text();
}

export async function fetchCharacterSlugs(): Promise<string[]> {
  const html = await fetchHtml(LISTING_URL);
  const slugs = [...html.matchAll(SLUG_LINK_PATTERN)].map((match) => match[1]);
  return [...new Set(slugs)].filter((slug): slug is string => slug !== undefined);
}

// Filenames aren't consistently named across the site's editorial history (some are
// "{Name}_build.webp", others "{Name}_{Archetype}_build-1.webp", others just
// "{Name}_{Archetype}.webp" with no "build" keyword at all) — but in every page checked,
// the character's own name-derived prefix (e.g. slug "hu-tao" -> filename "Hu-Tao_..." or
// "Hu_Tao_...") is what the *first* character-specific image on the page starts with,
// which is a much more reliable anchor than guessing at naming conventions.
function slugToFilenamePrefixes(slug: string): string[] {
  const parts = slug
    .split('-')
    .map((part) => (part ? (part[0]?.toUpperCase() ?? '') + part.slice(1) : part));
  return [parts.join('-').toLowerCase(), parts.join('_').toLowerCase()];
}

// Not every character page has a finished build guide yet (very recent releases often
// only have a "worth it" pull-recommendation article) — returns undefined in that case.
export async function fetchCharacterBuildPage(slug: string): Promise<GazetteBuildPage | undefined> {
  const pageUrl = `${BASE_URL}/personnages/${slug}/`;
  const html = await fetchHtml(pageUrl);

  const title = html.match(TITLE_PATTERN)?.[1]?.replace(NON_BREAKING_SPACE_PATTERN, ' ');
  const name = title?.split(' build')[0]?.trim();

  const prefixes = slugToFilenamePrefixes(slug);
  const imageUrl = [...html.matchAll(IMAGE_SRC_PATTERN)]
    .map((match) => match[1])
    .find((url) => {
      const filename = url?.split('/').pop()?.toLowerCase() ?? '';
      return prefixes.some(
        (prefix) => filename.startsWith(`${prefix}_`) || filename.startsWith(`${prefix}.`),
      );
    });

  if (!name || !imageUrl) return undefined;

  return { slug, name, imageUrl, pageUrl };
}
