import type { GenshinServer } from './genshin-servers.js';
import { SERVER_UTC_OFFSET_HOURS } from './genshin-servers.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const RESET_HOUR = 4;
const MONDAY = 1;

export function nextDailyReset(server: GenshinServer, from: Date = new Date()): Date {
  const offset = SERVER_UTC_OFFSET_HOURS[server];
  const utcResetHour = RESET_HOUR - offset;
  const candidate = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), utcResetHour, 0, 0, 0),
  );
  // A single date's naive UTC candidate can land more than 24h before `from` when the
  // reset's UTC hour goes negative (e.g. Asia, offset +8), so loop rather than roll once.
  while (candidate.getTime() <= from.getTime()) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
  }
  return candidate;
}

export function nextWeeklyReset(server: GenshinServer, from: Date = new Date()): Date {
  const offset = SERVER_UTC_OFFSET_HOURS[server];
  let candidate = nextDailyReset(server, from);

  for (let i = 0; i < 7; i++) {
    const serverLocalDay = new Date(candidate.getTime() + offset * 60 * 60 * 1000).getUTCDay();
    if (serverLocalDay === MONDAY) return candidate;
    candidate = new Date(candidate.getTime() + DAY_MS);
  }

  // Unreachable: a Monday always occurs within 7 days of any date.
  return candidate;
}
