import type { GenshinElement } from '../types/ambr.types.js';

// Ambr's element field uses these English codes regardless of locale, so we translate
// them ourselves to the official French in-game elemental terms.
export const ELEMENT_LABELS: Record<GenshinElement, string> = {
  Fire: 'Pyro',
  Water: 'Hydro',
  Wind: 'Anémo',
  Electric: 'Électro',
  Grass: 'Dendro',
  Ice: 'Cryo',
  Rock: 'Géo',
};

// Only the seven playable nations are mapped here. Characters tied to a faction rather
// than a nation (e.g. Fatui Harbingers) have a region code we deliberately don't guess
// a label for — the field is simply omitted from the embed in that case.
export const NATION_LABELS: Record<string, string> = {
  MONDSTADT: 'Mondstadt',
  LIYUE: 'Liyue',
  INAZUMA: 'Inazuma',
  SUMERU: 'Sumeru',
  FONTAINE: 'Fontaine',
  NATLAN: 'Natlan',
  NODKRAI: 'Nod-Krai',
};
