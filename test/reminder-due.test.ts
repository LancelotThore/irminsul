import { describe, expect, it } from 'vitest';
import { isResetDue } from '../src/lib/reminder-due.js';

describe('isResetDue', () => {
  it('is false when the next reset is still ahead of "now"', () => {
    // Asia daily reset is 20:00 UTC. Checking a window that ends well before that.
    const lastCheck = new Date('2026-07-08T10:00:00.000Z');
    const now = new Date('2026-07-08T15:00:00.000Z');
    expect(isResetDue('asia', 'daily', lastCheck, now)).toBe(false);
  });

  it('is true when the reset falls inside the (lastCheck, now] window', () => {
    const lastCheck = new Date('2026-07-08T19:59:00.000Z');
    const now = new Date('2026-07-08T20:01:00.000Z');
    expect(isResetDue('asia', 'daily', lastCheck, now)).toBe(true);
  });

  it('does not fire again once lastCheck has moved past the reset', () => {
    const lastCheck = new Date('2026-07-08T20:01:00.000Z');
    const now = new Date('2026-07-08T20:05:00.000Z');
    expect(isResetDue('asia', 'daily', lastCheck, now)).toBe(false);
  });

  it('checks the weekly reset when type is "weekly"', () => {
    // 2026-07-06 is a Monday in Asia-local time; the weekly reset lands at 20:00 UTC
    // on 2026-07-05 (Monday 04:00 Asia-local).
    const lastCheck = new Date('2026-07-05T19:59:00.000Z');
    const now = new Date('2026-07-05T20:01:00.000Z');
    expect(isResetDue('asia', 'weekly', lastCheck, now)).toBe(true);
    expect(isResetDue('asia', 'daily', lastCheck, now)).toBe(true);
  });
});
