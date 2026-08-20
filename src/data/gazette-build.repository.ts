import { eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { gazetteBuilds } from '../db/schema.js';

export interface GazetteBuild {
  slug: string;
  name: string;
  imageUrl: string;
  pageUrl: string;
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function normalizeCharacterName(name: string): string {
  return name
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function toBuild(row: typeof gazetteBuilds.$inferSelect): GazetteBuild {
  return { slug: row.slug, name: row.name, imageUrl: row.imageUrl, pageUrl: row.pageUrl };
}

export async function listGazetteBuilds(): Promise<GazetteBuild[]> {
  const rows = await db.select().from(gazetteBuilds).where(eq(gazetteBuilds.hidden, false));
  return rows.map(toBuild);
}

export async function findBuildByCharacterName(name: string): Promise<GazetteBuild | undefined> {
  const [row] = await db
    .select()
    .from(gazetteBuilds)
    .where(eq(gazetteBuilds.characterKey, normalizeCharacterName(name)));
  return row && !row.hidden ? toBuild(row) : undefined;
}
