import type { AmbrListResponse } from '../../types/ambr.types.js';

const BASE_URL = 'https://gi.yatta.moe/api/v2';
const LANG = 'fr';
const USER_AGENT = 'irminsul-discord-bot/0.1.0';

export const AMBR_ICON_BASE_URL = 'https://gi.yatta.moe/assets/UI';

export function ambrIconUrl(icon: string): string {
  return `${AMBR_ICON_BASE_URL}/${icon}.png`;
}

export async function fetchAmbrList<TItem>(resource: string): Promise<Record<string, TItem>> {
  const url = `${BASE_URL}/${LANG}/${resource}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

  if (!res.ok) {
    throw new Error(`Ambr request failed: ${res.status} ${res.statusText} (${url})`);
  }

  const body = (await res.json()) as AmbrListResponse<TItem>;

  if (body.response !== 200) {
    throw new Error(`Ambr API returned response code ${body.response} (${url})`);
  }

  return body.data.items;
}
