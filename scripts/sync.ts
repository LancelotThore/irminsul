import { runMigrations } from '../src/db/migrate.js';
import { logger } from '../src/lib/logger.js';
import { syncArtifactSets, syncCharacters, syncWeapons } from '../src/services/ambr/sync.js';

async function main(): Promise<void> {
  runMigrations();

  const [characters, weapons, artifactSets] = await Promise.all([
    syncCharacters(),
    syncWeapons(),
    syncArtifactSets(),
  ]);

  logger.info(
    `Synced ${characters.length} characters, ${weapons.length} weapons, ` +
      `${artifactSets.length} artifact sets.`,
  );
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Ambr sync failed');
  process.exit(1);
});
