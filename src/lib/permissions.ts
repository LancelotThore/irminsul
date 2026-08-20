import { env } from '../config/env.js';

export function isOwner(userId: string): boolean {
  return userId === env.BOT_OWNER_ID;
}
