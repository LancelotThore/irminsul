import { splitSlot } from '../lib/material-slots.js';
import type { MaterialSlot } from '../lib/material-slots.js';
import type { CharacterMaterials, MaterialRef } from '../types/ambr.types.js';

export interface MaterialSlotRow {
  characterId: string;
  characterName: string;
  characterIcon: string;
  slot: MaterialSlot;
  materialId: number;
  materialName: string;
  materialIcon: string;
  materialRank: number | null;
}

// Pure: flat join rows (one per filled slot) in, nested CharacterMaterials[] out — the
// inverse of the flattening sync.ts does when writing to character_material_slots.
export function groupMaterialSlots(rows: MaterialSlotRow[]): CharacterMaterials[] {
  const byCharacter = new Map<string, CharacterMaterials>();

  for (const row of rows) {
    let entry = byCharacter.get(row.characterId);
    if (!entry) {
      entry = {
        characterId: row.characterId,
        characterName: row.characterName,
        characterIcon: row.characterIcon,
        ascension: {},
        talents: {},
      };
      byCharacter.set(row.characterId, entry);
    }

    // A slot is only ever populated by pickBest() (from the always-ranked avatar-detail
    // response) or by an admin edit that already rejects rank-less materials — the
    // catalog rank should never actually be null here, but the column allows it.
    const ref: MaterialRef = {
      id: row.materialId,
      name: row.materialName,
      icon: row.materialIcon,
      rank: row.materialRank ?? 0,
    };

    const { section, key } = splitSlot(row.slot);
    if (section === 'ascension') {
      (entry.ascension as Record<string, MaterialRef>)[key] = ref;
    } else {
      (entry.talents as Record<string, MaterialRef>)[key] = ref;
    }
  }

  return [...byCharacter.values()];
}
