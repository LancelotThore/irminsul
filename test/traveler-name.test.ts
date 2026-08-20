import { describe, expect, it } from 'vitest';
import { disambiguatedName } from '../src/services/ambr/character-name.js';
import { normalizeCharacterName } from '../src/data/gazette-build.repository.js';

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

describe('normalizeCharacterName (Traveler gender folding)', () => {
  it('normalizes a male and female Traveler entry to the same key', () => {
    expect(normalizeCharacterName('Voyageur Anémo')).toBe(
      normalizeCharacterName('Voyageuse Anémo'),
    );
  });

  it('matches the Gazette build title format exactly', () => {
    expect(normalizeCharacterName('Voyageur Anémo')).toBe('voyageuranemo');
    expect(normalizeCharacterName('Voyageuse Anémo')).toBe('voyageuranemo');
  });

  it('does not fold unrelated names starting with a similar prefix', () => {
    expect(normalizeCharacterName('Voyageuse Dendro')).not.toBe(
      normalizeCharacterName('Voyageur Anémo'),
    );
  });
});
