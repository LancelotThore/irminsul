import { eq } from 'drizzle-orm';
import { normalizeCharacterName } from './gazette-build.repository.js';
import { db } from '../db/client.js';
import { materialsGuides } from '../db/schema.js';

export interface MaterialsGuide {
  slug: string;
  name: string;
  imageUrl: string;
  pageUrl: string;
}

function toGuide(row: typeof materialsGuides.$inferSelect): MaterialsGuide {
  return { slug: row.slug, name: row.name, imageUrl: row.imageUrl, pageUrl: row.pageUrl };
}

export async function listMaterialsGuides(): Promise<MaterialsGuide[]> {
  const rows = await db.select().from(materialsGuides).where(eq(materialsGuides.hidden, false));
  return rows.map(toGuide);
}

export async function findMaterialsGuideByCharacterName(
  name: string,
): Promise<MaterialsGuide | undefined> {
  const [row] = await db
    .select()
    .from(materialsGuides)
    .where(eq(materialsGuides.characterKey, normalizeCharacterName(name)));
  return row && !row.hidden ? toGuide(row) : undefined;
}
