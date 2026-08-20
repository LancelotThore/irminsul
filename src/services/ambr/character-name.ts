import { ELEMENT_LABELS } from '../../lib/genshin-labels.js';
import type { GenshinElement } from '../../types/ambr.types.js';

// Ambr gives every Traveler variant (one per element, ×2 for gender) the exact same
// bare name — without this, /character, /materials and /build autocomplete can't tell
// them apart and silently resolve to whichever one happens to come first.
const TRAVELER_NAMES = new Set(['Voyageur', 'Voyageuse']);

// Aether and Lumine are the same character in every way that matters here — identical
// stats, ascension and talent materials per element, the only difference is which one
// the player picked once at the very start of the game. Ambr models them as fully
// separate entries (different ids/icons), which would otherwise show every element
// twice in /characters and /materials for no useful reason. Voyageur (Aether) is kept
// as the single canonical entry per element; the choice between the two is arbitrary,
// since neither is more "correct" than the other.
const CANONICAL_TRAVELER_NAME = 'Voyageur';

export function isCanonicalCharacter(name: string): boolean {
  return !TRAVELER_NAMES.has(name) || name === CANONICAL_TRAVELER_NAME;
}

export function disambiguatedName(name: string, element: GenshinElement): string {
  return TRAVELER_NAMES.has(name) ? `${name} ${ELEMENT_LABELS[element]}` : name;
}
