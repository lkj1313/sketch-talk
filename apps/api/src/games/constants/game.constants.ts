import { WordDifficulty } from '@/generated/prisma/client';

export const GAME_MESSAGE_MAX_LENGTH = 100;
export const GAME_ROUND_DURATION_SECONDS = 120;
export const GAME_ROUND_EXPIRATION_CHECK_INTERVAL_MS = 1_000;
export const DRAWING_PERMISSION_CACHE_TTL_MS = 1_000;

export const GAME_DIFFICULTY_SCORE: Record<WordDifficulty, number> = {
  [WordDifficulty.EASY]: 100,
  [WordDifficulty.MEDIUM]: 150,
  [WordDifficulty.HARD]: 200,
};

export const DRAWER_SCORE_RATIO = 0.5;

export function createRoundExpiresAt(startedAt: Date): Date {
  return new Date(startedAt.getTime() + GAME_ROUND_DURATION_SECONDS * 1_000);
}
