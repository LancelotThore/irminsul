import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');

export async function readCache<T>(filename: string): Promise<T[]> {
  const filePath = path.join(CACHE_DIR, filename);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as T[];
}

// Write to a temp file then rename, so a failed sync never leaves a truncated/corrupt cache file behind.
export async function writeCacheFile(filename: string, data: unknown): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  const finalPath = path.join(CACHE_DIR, filename);
  const tempPath = `${finalPath}.tmp`;
  await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  await rename(tempPath, finalPath);
}
