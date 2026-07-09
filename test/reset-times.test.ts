import { describe, expect, it } from 'vitest';
import { nextDailyReset, nextWeeklyReset } from '../src/lib/reset-times.js';

describe('nextDailyReset', () => {
  it("returns today's reset when called before it (Asia, UTC+8 -> 20:00 UTC previous day)", () => {
    // 2026-07-08T17:00Z is Asia-local 2026-07-09 01:00, i.e. before that day's 4am reset.
    const from = new Date('2026-07-08T17:00:00.000Z');
    expect(nextDailyReset('asia', from).toISOString()).toBe('2026-07-08T20:00:00.000Z');
  });

  it('rolls over to the next day when called after reset has already passed', () => {
    const from = new Date('2026-07-09T21:00:00.000Z');
    expect(nextDailyReset('asia', from).toISOString()).toBe('2026-07-10T20:00:00.000Z');
  });

  it('handles the Europe positive offset (UTC+1 -> 03:00 UTC)', () => {
    const from = new Date('2026-07-09T00:00:00.000Z');
    expect(nextDailyReset('europe', from).toISOString()).toBe('2026-07-09T03:00:00.000Z');
  });

  it('handles the America negative offset (UTC-5 -> 09:00 UTC)', () => {
    const from = new Date('2026-07-09T00:00:00.000Z');
    expect(nextDailyReset('america', from).toISOString()).toBe('2026-07-09T09:00:00.000Z');
  });

  it('treats a call exactly at reset time as already passed', () => {
    const from = new Date('2026-07-09T20:00:00.000Z');
    expect(nextDailyReset('asia', from).toISOString()).toBe('2026-07-10T20:00:00.000Z');
  });
});

describe('nextWeeklyReset', () => {
  const servers = ['asia', 'europe', 'america'] as const;

  it.each(servers)('finds a future reset that falls on server-local Monday for %s', (server) => {
    const from = new Date('2026-07-09T10:00:00.000Z');
    const offset = { asia: 8, europe: 1, america: -5 }[server];
    const result = nextWeeklyReset(server, from);

    expect(result.getTime()).toBeGreaterThan(from.getTime());
    expect(result.getTime() - from.getTime()).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000);
    expect(new Date(result.getTime() + offset * 60 * 60 * 1000).getUTCDay()).toBe(1);
  });

  it('returns the same day when already Monday and before reset', () => {
    // 2026-07-06 is a Monday in Asia-local time; 2026-07-05T17:00Z is Monday 01:00
    // Asia-local, i.e. still before that Monday's 4am reset (2026-07-05T20:00Z).
    const from = new Date('2026-07-05T17:00:00.000Z');
    const result = nextWeeklyReset('asia', from);
    expect(result.toISOString()).toBe('2026-07-05T20:00:00.000Z');
  });
});
