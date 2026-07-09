import type { AmbrListResponse } from '../../types/ambr.types.js';

const BASE_URL = 'https://gi.yatta.moe/api/v2';
const LANG = 'fr';
const USER_AGENT = 'irminsul-discord-bot/0.1.0';

export const AMBR_ICON_BASE_URL = 'https://gi.yatta.moe/assets/UI';

export function ambrIconUrl(icon: string): string {
  return `${AMBR_ICON_BASE_URL}/${icon}.png`;
}

async function fetchAmbrData<TItem>(resource: string): Promise<AmbrListResponse<TItem>['data']> {
  const url = `${BASE_URL}/${LANG}/${resource}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

  if (!res.ok) {
    throw new Error(`Ambr request failed: ${res.status} ${res.statusText} (${url})`);
  }

  const body = (await res.json()) as AmbrListResponse<TItem>;

  if (body.response !== 200) {
    throw new Error(`Ambr API returned response code ${body.response} (${url})`);
  }

  return body.data;
}

export async function fetchAmbrList<TItem>(resource: string): Promise<Record<string, TItem>> {
  const data = await fetchAmbrData<TItem>(resource);
  return data.items;
}

// The 'types' dict on the weapon list is Ambr's own French translation of weapon type
// codes (e.g. WEAPON_SWORD_ONE_HAND -> "Épée à une main"), so we reuse it instead of
// maintaining our own translation table.
export async function fetchWeaponTypeLabels(): Promise<Record<string, string>> {
  const data = await fetchAmbrData<unknown>('weapon');
  return data.types ?? {};
}
