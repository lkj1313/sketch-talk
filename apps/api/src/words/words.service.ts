import { Injectable } from '@nestjs/common';
import { AppException } from '@/common/exceptions/app.exception';
import { MAX_WORD_LENGTH } from '@/words/constants/word.constants';
import { WORD_ERROR } from '@/words/constants/word-error.constants';
import { GenerateWordsDto } from '@/words/dto/generate-words.dto';
import {
  GeneratedWordDto,
  GenerateWordsResponseDto,
} from '@/words/dto/generate-words-response.dto';
import { KimiService } from '@/words/providers/kimi.service';

@Injectable()
export class WordsService {
  constructor(private readonly kimiService: KimiService) {}

  async generate(dto: GenerateWordsDto): Promise<GenerateWordsResponseDto> {
    const generatedWords = await this.kimiService.generateWords(dto);
    const words = this.normalizeWords(generatedWords);

    if (words.length !== dto.count) {
      throw new AppException(WORD_ERROR.INVALID_KIMI_RESPONSE);
    }

    return new GenerateWordsResponseDto(
      words.map(
        (word) => new GeneratedWordDto(word, dto.category, dto.difficulty),
      ),
    );
  }

  private normalizeWords(words: string[]): string[] {
    const uniqueWords = new Map<string, string>();

    for (const word of words) {
      const normalizedWord = word.trim();

      if (
        normalizedWord.length === 0 ||
        normalizedWord.length > MAX_WORD_LENGTH
      ) {
        continue;
      }

      uniqueWords.set(
        normalizedWord.toLocaleLowerCase('ko-KR'),
        normalizedWord,
      );
    }

    return [...uniqueWords.values()];
  }
}
