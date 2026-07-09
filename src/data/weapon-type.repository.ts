import { readCacheRecord } from './repository.js';

export async function getWeaponTypeLabels(): Promise<Record<string, string>> {
  return readCacheRecord<string>('weapon-type-labels.json');
}
