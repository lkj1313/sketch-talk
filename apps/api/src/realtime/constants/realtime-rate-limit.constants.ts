export type RealtimeRateLimitRule = {
  limit: number;
  windowMs: number;
};

export const REALTIME_RATE_LIMIT = {
  GAME_MESSAGE: { limit: 5, windowMs: 5_000 },
  DRAWING_STROKE: { limit: 40, windowMs: 1_000 },
  DRAWING_CLEAR: { limit: 2, windowMs: 3_000 },
} as const satisfies Record<string, RealtimeRateLimitRule>;
