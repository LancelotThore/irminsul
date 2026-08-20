import { describe, expect, it } from 'vitest';
import { disambiguatedName, isCanonicalCharacter } from '../src/services/ambr/character-name.js';

describe('disambiguatedName', () => {
  it('appends the element label to a male Traveler entry', () => {
    expect(disambiguatedName('Voyageur', 'Wind')).toBe('Voyageur Anémo');
  });

  it('appends the element label to a female Traveler entry', () => {
    expect(disambiguatedName('Voyageuse', 'Grass')).toBe('Voyageuse Dendro');
  });

  it('leaves every other character name untouched', () => {
    expect(disambiguatedName('Amber', 'Fire')).toBe('Amber');
  });
});

describe('isCanonicalCharacter', () => {
  it('keeps the male Traveler entry (Aether)', () => {
    expect(isCanonicalCharacter('Voyageur')).toBe(true);
  });

  it('drops the female Traveler entry (Lumine) — same character, same stats per element', () => {
    expect(isCanonicalCharacter('Voyageuse')).toBe(false);
  });

  it('keeps every other character', () => {
    expect(isCanonicalCharacter('Amber')).toBe(true);
  });
});
