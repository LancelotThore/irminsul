import { fetchCharacterBuildPage, fetchCharacterSlugs } from './client.js';
import { writeCacheFile } from '../../data/repository.js';
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
      } else {
        logger.warn(`Gazette page "${slug}" has no build guide yet, skipping`);
      }
    } catch (error) {
      logger.warn({ err: error, slug }, 'Failed to fetch Gazette character page, skipping');
    }
    await sleep(REQUEST_DELAY_MS);
  }

  await writeCacheFile('gazette-builds.json', pages);
  return pages;
}
