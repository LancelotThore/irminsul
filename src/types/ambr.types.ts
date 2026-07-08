export interface AmbrListResponse<TItem> {
  response: number;
  data: {
    items: Record<string, TItem>;
  };
}

export interface AmbrCharacterSummary {
  id: number;
  rank: number;
  name: string;
  element: string;
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
