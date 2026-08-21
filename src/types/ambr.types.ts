export interface AmbrListResponse<TItem> {
  response: number;
  data: {
    items: Record<string, TItem>;
  };
}

export type GenshinElement = 'Fire' | 'Water' | 'Wind' | 'Electric' | 'Grass' | 'Ice' | 'Rock';

export interface AmbrCharacterSummary {
  // String, not number: Ambr uses composite ids like "10000005-pyro" for Traveler
  // variants (one base character id, one suffix per element).
  id: string;
  rank: number;
  name: string;
  element: GenshinElement;
  weaponType: string;
  region?: string;
  icon: string;
}

export interface AmbrWeaponSummary {
  id: number;
  rank: number;
  type: string;
  name: string;
  icon: string;
}

export interface AmbrArtifactSetSummary {
  id: number;
  name: string;
  icon: string;
}
