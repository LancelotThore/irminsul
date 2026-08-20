import type { GenshinServer } from './genshin-servers.js';
import { nextDailyReset, nextWeeklyReset } from './reset-times.js';

export type ReminderType = 'daily' | 'weekly';

// True when the next occurrence of `type`'s reset, as seen from `lastCheck`, has
// already happened by `now` — i.e. it fell inside the (lastCheck, now] window. The
// scheduler advances `lastCheck` to `now` after every tick, so each reset fires once.
export function isResetDue(
  server: GenshinServer,
  type: ReminderType,
  lastCheck: Date,
  now: Date,
): boolean {
  const next =
    type === 'daily' ? nextDailyReset(server, lastCheck) : nextWeeklyReset(server, lastCheck);
  return next.getTime() <= now.getTime();
}
