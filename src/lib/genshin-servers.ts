export type GenshinServer = 'asia' | 'europe' | 'america';

export const SERVER_LABELS: Record<GenshinServer, string> = {
  asia: 'Asie',
  europe: 'Europe',
  america: 'Amérique',
};

// The in-game server clock uses a fixed offset from UTC year-round — it does not
// observe real-world daylight saving time, even for the Europe/America servers.
export const SERVER_UTC_OFFSET_HOURS: Record<GenshinServer, number> = {
  asia: 8,
  europe: 1,
  america: -5,
};
