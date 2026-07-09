import { logger } from '../src/lib/logger.js';
import {
  syncArtifactSets,
  syncCharacters,
  syncMaterials,
  syncWeaponTypeLabels,
  syncWeapons,
} from '../src/services/ambr/sync.js';

async function main(): Promise<void> {
  const [characters, weapons, artifactSets, materials, weaponTypeLabels] = await Promise.all([
    syncCharacters(),
    syncWeapons(),
    syncArtifactSets(),
    syncMaterials(),
    syncWeaponTypeLabels(),
  ]);

  logger.info(
    `Synced ${characters.length} characters, ${weapons.length} weapons, ` +
      `${artifactSets.length} artifact sets, ${materials.length} materials, ` +
      `${Object.keys(weaponTypeLabels).length} weapon type labels.`,
  );
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Ambr sync failed');
  process.exit(1);
});
