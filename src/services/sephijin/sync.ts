import { eq, sql } from 'drizzle-orm';
import { fetchCharacterMaterialsGuide, fetchCharacterSlugs } from './client.js';
import { listCharacters } from '../../data/character.repository.js';
import { normalizeCharacterName } from '../../data/gazette-build.repository.js';
import { db } from '../../db/client.js';
import { materialsGuides } from '../../db/schema.js';
import { logger } from '../../lib/logger.js';
import type { SephijinMaterialsGuidePage } from './client.js';

// A small site, not an API built for bulk access — space requests out rather than
// hammering it during sync, same reasoning as the Gazette sync.
const REQUEST_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncMaterialsGuides(): Promise<SephijinMaterialsGuidePage[]> {
  const [slugs, characters] = await Promise.all([fetchCharacterSlugs(), listCharacters()]);
  // The site mixes character pages with hub/feed/category pages under the same /slug/
  // shape, and some of those non-character pages embed a "recent guides" widget that
  // happens to carry the same guide-farm-materiaux image as a real character page —
  // so presence of the image alone isn't a reliable enough signal. Cross-checking the
  // extracted name against our own synced character list filters those out, since a
  // hub page's title ("Guides synthèse...", the bare site name, ...) never matches one.
  const knownNames = new Set(characters.map((c) => normalizeCharacterName(c.name)));

  const pages: SephijinMaterialsGuidePage[] = [];

  for (const slug of slugs) {
    try {
      const page = await fetchCharacterMaterialsGuide(slug);
      if (page && knownNames.has(normalizeCharacterName(page.name))) {
        pages.push(page);
        const characterKey = normalizeCharacterName(page.name);
        await db
          .insert(materialsGuides)
          .values({ characterKey, ...page, source: 'sephijin' })
          .onConflictDoUpdate({
            target: materialsGuides.characterKey,
            set: { ...page, source: 'sephijin', updatedAt: sql`(current_timestamp)` },
            setWhere: eq(materialsGuides.locked, false),
          });
      }
    } catch (error) {
      logger.warn({ err: error, slug }, 'Failed to fetch Sephijin character page, skipping');
    }
    await sleep(REQUEST_DELAY_MS);
  }

  return pages;
}
