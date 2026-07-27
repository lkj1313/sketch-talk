import { WordDifficulty } from '@/words/constants/word.constants';

export class GeneratedWordDto {
  answer: string;
  category: string;
  difficulty: WordDifficulty;

  constructor(answer: string, category: string, difficulty: WordDifficulty) {
    this.answer = answer;
    this.category = category;
    this.difficulty = difficulty;
  }
}

export class GenerateWordsResponseDto {
  words: GeneratedWordDto[];

  constructor(words: GeneratedWordDto[]) {
    this.words = words;
  }
}
