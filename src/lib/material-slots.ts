import type { CharacterAscensionMaterials, CharacterTalentMaterials } from '../types/ambr.types.js';

export type AscensionKey = keyof CharacterAscensionMaterials;
export type TalentKey = keyof CharacterTalentMaterials;
export type MaterialSlot = `ascension_${AscensionKey}` | `talent_${TalentKey}`;

export const ASCENSION_KEYS: AscensionKey[] = [
  'localSpecialty',
  'gem',
  'commonDrop',
  'bossMaterial',
];
export const TALENT_KEYS: TalentKey[] = ['commonDrop', 'book', 'bossMaterial', 'crown'];

export const SLOT_LABELS: Record<MaterialSlot, string> = {
  ascension_localSpecialty: 'Ascension - Spécialité locale',
  ascension_gem: 'Ascension - Gemme',
  ascension_commonDrop: 'Ascension - Butin commun',
  ascension_bossMaterial: 'Ascension - Matériau de boss',
  talent_commonDrop: 'Talent - Butin commun',
  talent_book: 'Talent - Livre',
  talent_bossMaterial: 'Talent - Matériau de boss hebdomadaire',
  talent_crown: 'Talent - Couronne',
};

export function splitSlot(slot: MaterialSlot): { section: 'ascension' | 'talent'; key: string } {
  if (slot.startsWith('ascension_')) {
    return { section: 'ascension', key: slot.slice('ascension_'.length) };
  }
  return { section: 'talent', key: slot.slice('talent_'.length) };
}
