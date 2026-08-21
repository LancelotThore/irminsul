import { runMigrations } from '../src/db/migrate.js';
import { logger } from '../src/lib/logger.js';
import { syncMaterialsGuides } from '../src/services/sephijin/sync.js';

async function main(): Promise<void> {
  runMigrations();

  const pages = await syncMaterialsGuides();
  logger.info(`Synced ${pages.length} Sephijin materials guides.`);
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Materials guide sync failed');
  process.exit(1);
});
