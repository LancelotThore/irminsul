export interface AmbrListResponse<TItem> {
  response: number;
  data: {
    items: Record<string, TItem>;
    types?: Record<string, string>;
  };
}

export type GenshinElement = 'Fire' | 'Water' | 'Wind' | 'Electric' | 'Grass' | 'Ice' | 'Rock';

export interface AmbrCharacterSummary {
  id: number;
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

export interface AmbrMaterialSummary {
  id: number;
  name: string;
  type: string;
  rank?: number;
  icon: string;
}
