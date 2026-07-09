import { logger } from '../src/lib/logger.js';
import { syncCharacterMaterials } from '../src/services/ambr/materials.js';

async function main(): Promise<void> {
  const results = await syncCharacterMaterials();
  logger.info(`Synced ascension/talent materials for ${results.length} characters.`);
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Character materials sync failed');
  process.exit(1);
});
