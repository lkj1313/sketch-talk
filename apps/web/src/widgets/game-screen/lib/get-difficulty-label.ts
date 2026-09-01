import type { WordDifficulty } from '@sketch-talk/contracts'

const DIFFICULTY_LABEL: Record<WordDifficulty, string> = {
  EASY: '쉬움',
  MEDIUM: '보통',
  HARD: '어려움',
}

export function getDifficultyLabel(difficulty: WordDifficulty): string {
  return DIFFICULTY_LABEL[difficulty]
}
