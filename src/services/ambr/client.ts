import type { AmbrListResponse } from '../../types/ambr.types.js';

const BASE_URL = 'https://gi.yatta.moe/api/v2';
const LANG = 'fr';
const USER_AGENT = 'irminsul-discord-bot/0.1.0';

export const AMBR_ICON_BASE_URL = 'https://gi.yatta.moe/assets/UI';

export function ambrIconUrl(icon: string): string {
  return `${AMBR_ICON_BASE_URL}/${icon}.png`;
}

async function fetchAmbrJson<TData>(path: string): Promise<TData> {
  const url = `${BASE_URL}/${LANG}/${path}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

  if (!res.ok) {
    throw new Error(`Ambr request failed: ${res.status} ${res.statusText} (${url})`);
  }

  const body = (await res.json()) as { response: number; data: TData };

  if (body.response !== 200) {
    throw new Error(`Ambr API returned response code ${body.response} (${url})`);
  }

  return body.data;
}

export async function fetchAmbrList<TItem>(resource: string): Promise<Record<string, TItem>> {
  const data = await fetchAmbrJson<AmbrListResponse<TItem>['data']>(resource);
  return data.items;
}

// Detail endpoints (e.g. /avatar/{id}) return the object directly as `data`, unlike list
// endpoints which wrap it in `{ items: {...} }`.
export async function fetchAmbrDetail<TDetail>(
  resource: string,
  id: number | string,
): Promise<TDetail> {
  return fetchAmbrJson<TDetail>(`${resource}/${id}`);
}
