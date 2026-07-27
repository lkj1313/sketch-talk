import { WordDifficulty } from '@/generated/prisma/client';

export const GAME_MESSAGE_MAX_LENGTH = 100;

export const GAME_DIFFICULTY_SCORE: Record<WordDifficulty, number> = {
  [WordDifficulty.EASY]: 100,
  [WordDifficulty.MEDIUM]: 150,
  [WordDifficulty.HARD]: 200,
};

export const DRAWER_SCORE_RATIO = 0.5;
