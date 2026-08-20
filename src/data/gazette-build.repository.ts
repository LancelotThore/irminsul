import { readCache } from './repository.js';
import type { GazetteBuildPage } from '../services/gazette/client.js';

export type GazetteBuild = GazetteBuildPage;

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function normalizeCharacterName(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  // La Gazette guides aren't split by Traveler gender (only by element), but our
  // character data is ("Voyageur"/"Voyageuse") — fold the female form onto the male
  // one so both resolve to the same build guide.
  return normalized.replace(/^voyageuse/, 'voyageur');
}

export async function listGazetteBuilds(): Promise<GazetteBuild[]> {
  return readCache<GazetteBuild>('gazette-builds.json');
}

export async function findBuildByCharacterName(name: string): Promise<GazetteBuild | undefined> {
  const builds = await listGazetteBuilds();
  const target = normalizeCharacterName(name);
  return builds.find((build) => normalizeCharacterName(build.name) === target);
}
