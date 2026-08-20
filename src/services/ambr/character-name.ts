import { ELEMENT_LABELS } from '../../lib/genshin-labels.js';
import type { GenshinElement } from '../../types/ambr.types.js';

// Ambr gives every Traveler variant (one per element, ×2 for gender) the exact same
// bare name — without this, /character, /materials and /build autocomplete can't tell
// them apart and silently resolve to whichever one happens to come first.
const TRAVELER_NAMES = new Set(['Voyageur', 'Voyageuse']);

export function disambiguatedName(name: string, element: GenshinElement): string {
  return TRAVELER_NAMES.has(name) ? `${name} ${ELEMENT_LABELS[element]}` : name;
}
