export interface AmbrListResponse<TItem> {
  response: number;
  data: {
    items: Record<string, TItem>;
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

// Minimal shape of the /avatar/{id} detail endpoint — only the fields needed to compute
// ascension and talent material costs.
export interface AmbrAvatarDetail {
  id: number;
  name: string;
  icon: string;
  items: Record<string, { name: string; rank: number; icon: string }>;
  upgrade: {
    promote: { promoteLevel?: number; costItems?: Record<string, number> | null }[];
  };
  // Passive talents have no "promote" field at all — only active skills can be upgraded.
  talent: Record<
    string,
    { promote?: Record<string, { costItems?: Record<string, number> | null }> }
  >;
}

export interface MaterialRef {
  id: number;
  name: string;
  icon: string;
  rank: number;
}

export interface CharacterAscensionMaterials {
  localSpecialty?: MaterialRef;
  gem?: MaterialRef;
  commonDrop?: MaterialRef;
  bossMaterial?: MaterialRef;
}

export interface CharacterTalentMaterials {
  commonDrop?: MaterialRef;
  book?: MaterialRef;
  bossMaterial?: MaterialRef;
  crown?: MaterialRef;
}

export interface CharacterMaterials {
  characterId: number;
  characterName: string;
  characterIcon: string;
  ascension: CharacterAscensionMaterials;
  talents: CharacterTalentMaterials;
}
