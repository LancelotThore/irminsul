import { runMigrations } from '../src/db/migrate.js';
import { logger } from '../src/lib/logger.js';
import {
  syncArtifactSets,
  syncCharacters,
  syncMaterials,
  syncWeapons,
} from '../src/services/ambr/sync.js';

async function main(): Promise<void> {
  runMigrations();

  const [characters, weapons, artifactSets, materials] = await Promise.all([
    syncCharacters(),
    syncWeapons(),
    syncArtifactSets(),
    syncMaterials(),
  ]);

  logger.info(
    `Synced ${characters.length} characters, ${weapons.length} weapons, ` +
      `${artifactSets.length} artifact sets, ${materials.length} materials.`,
  );
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Ambr sync failed');
  process.exit(1);
});
