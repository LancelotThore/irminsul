import { eq, sql } from 'drizzle-orm';
import { fetchCharacterBuildPage, fetchCharacterSlugs } from './client.js';
import { normalizeCharacterName } from '../../data/gazette-build.repository.js';
import { db } from '../../db/client.js';
import { gazetteBuilds } from '../../db/schema.js';
import { logger } from '../../lib/logger.js';
import type { GazetteBuildPage } from './client.js';

// This is a small community WordPress site, not an API built for bulk access — space
// requests out rather than hammering it during sync.
const REQUEST_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function syncGazetteBuilds(): Promise<GazetteBuildPage[]> {
  const slugs = await fetchCharacterSlugs();
  const pages: GazetteBuildPage[] = [];

  for (const slug of slugs) {
    try {
      const page = await fetchCharacterBuildPage(slug);
      if (page) {
        pages.push(page);
        const characterKey = normalizeCharacterName(page.name);
        await db
          .insert(gazetteBuilds)
          .values({ characterKey, ...page, source: 'gazette' })
          .onConflictDoUpdate({
            target: gazetteBuilds.characterKey,
            set: { ...page, source: 'gazette', updatedAt: sql`(current_timestamp)` },
            setWhere: eq(gazetteBuilds.locked, false),
          });
      } else {
        logger.warn(`Gazette page "${slug}" has no build guide yet, skipping`);
      }
    } catch (error) {
      logger.warn({ err: error, slug }, 'Failed to fetch Gazette character page, skipping');
    }
    await sleep(REQUEST_DELAY_MS);
  }

  return pages;
}
