import { WordDifficulty } from '@/generated/prisma/client';

export const WORD_POOL_CATEGORY = '전체';
export const MAX_WORD_LENGTH = 50;
export const WORD_GENERATION_BATCH_SIZE = 20;
export const MAX_WORD_GENERATION_ATTEMPTS = 10;
export const WORD_POOL_TIME_ZONE = 'Asia/Seoul';
export const WORD_POOL_WEEKLY_CRON = '0 0 3 * * 1';

export const WORD_DIFFICULTIES = [
  WordDifficulty.EASY,
  WordDifficulty.MEDIUM,
  WordDifficulty.HARD,
] as const;

export const WORD_POOL_TARGET: Record<WordDifficulty, number> = {
  [WordDifficulty.EASY]: 140,
  [WordDifficulty.MEDIUM]: 50,
  [WordDifficulty.HARD]: 10,
};

export const WORD_POOL_WEEKLY_REPLACEMENT: Record<WordDifficulty, number> = {
  [WordDifficulty.EASY]: 14,
  [WordDifficulty.MEDIUM]: 5,
  [WordDifficulty.HARD]: 1,
};
