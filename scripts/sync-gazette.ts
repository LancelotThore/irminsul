import { runMigrations } from '../src/db/migrate.js';
import { logger } from '../src/lib/logger.js';
import { syncGazetteBuilds } from '../src/services/gazette/sync.js';

async function main(): Promise<void> {
  runMigrations();

  const pages = await syncGazetteBuilds();
  logger.info(`Synced ${pages.length} La Gazette de Teyvat build guides.`);
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Gazette sync failed');
  process.exit(1);
});
