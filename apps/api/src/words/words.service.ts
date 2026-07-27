import { Injectable, Logger } from '@nestjs/common';
import { Prisma, WordDifficulty } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  MAX_WORD_GENERATION_ATTEMPTS,
  MAX_WORD_LENGTH,
  WORD_DIFFICULTIES,
  WORD_GENERATION_BATCH_SIZE,
  WORD_POOL_CATEGORY,
  WORD_POOL_TARGET,
  WORD_POOL_WEEKLY_REPLACEMENT,
} from '@/words/constants/word.constants';
import { KimiService } from '@/words/providers/kimi.service';

@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kimiService: KimiService,
  ) {}

  async ensurePool(): Promise<void> {
    for (const difficulty of WORD_DIFFICULTIES) {
      const activeCount = await this.prisma.word.count({
        where: { difficulty, isActive: true },
      });
      const missingCount = Math.max(
        WORD_POOL_TARGET[difficulty] - activeCount,
        0,
      );

      if (missingCount === 0) {
        continue;
      }

      const words = await this.collectNewWords(difficulty, missingCount);
      const result = await this.prisma.word.createMany({
        data: words,
        skipDuplicates: true,
      });

      this.logger.log(
        `${difficulty} 제시어 ${result.count}개를 최초 보충했습니다.`,
      );
    }
  }

  async rotatePool(): Promise<void> {
    for (const difficulty of WORD_DIFFICULTIES) {
      const replacementCount = WORD_POOL_WEEKLY_REPLACEMENT[difficulty];
      const newWords = await this.collectNewWords(difficulty, replacementCount);

      if (newWords.length === 0) {
        continue;
      }

      const newNormalizedAnswers = newWords.map(
        (word) => word.normalizedAnswer,
      );
      const result = await this.prisma.$transaction(async (transaction) => {
        const created = await transaction.word.createMany({
          data: newWords,
          skipDuplicates: true,
        });

        if (created.count === 0) {
          return { createdCount: 0, retiredCount: 0 };
        }

        const retirementTargets = await transaction.word.findMany({
          where: {
            difficulty,
            isActive: true,
            normalizedAnswer: { notIn: newNormalizedAnswers },
          },
          orderBy: [{ usageCount: 'desc' }, { createdAt: 'asc' }],
          take: created.count,
          select: { id: true },
        });
        const retired = await transaction.word.updateMany({
          where: { id: { in: retirementTargets.map((word) => word.id) } },
          data: { isActive: false },
        });

        return {
          createdCount: created.count,
          retiredCount: retired.count,
        };
      });

      this.logger.log(
        `${difficulty} 제시어 ${result.createdCount}개를 추가하고 ${result.retiredCount}개를 비활성화했습니다.`,
      );
    }
  }

  private async collectNewWords(
    difficulty: WordDifficulty,
    count: number,
  ): Promise<Prisma.WordCreateManyInput[]> {
    const collectedWords = new Map<string, Prisma.WordCreateManyInput>();

    for (
      let attempt = 0;
      attempt < MAX_WORD_GENERATION_ATTEMPTS && collectedWords.size < count;
      attempt += 1
    ) {
      const requestCount = Math.min(
        count - collectedWords.size,
        WORD_GENERATION_BATCH_SIZE,
      );
      const generatedWords = await this.kimiService.generateWords({
        count: requestCount,
        category: WORD_POOL_CATEGORY,
        difficulty,
      });
      const candidates = this.normalizeWords(generatedWords).filter(
        (word) => !collectedWords.has(word.normalizedAnswer),
      );

      if (candidates.length === 0) {
        continue;
      }

      const existingWords = await this.prisma.word.findMany({
        where: {
          normalizedAnswer: {
            in: candidates.map((word) => word.normalizedAnswer),
          },
        },
        select: { normalizedAnswer: true },
      });
      const existingAnswers = new Set(
        existingWords.map((word) => word.normalizedAnswer),
      );

      for (const candidate of candidates) {
        if (!existingAnswers.has(candidate.normalizedAnswer)) {
          collectedWords.set(candidate.normalizedAnswer, {
            ...candidate,
            difficulty,
          });
        }

        if (collectedWords.size === count) {
          break;
        }
      }
    }

    if (collectedWords.size < count) {
      this.logger.warn(
        `${difficulty} 제시어 ${count}개 중 ${collectedWords.size}개만 새로 생성했습니다.`,
      );
    }

    return [...collectedWords.values()];
  }

  private normalizeWords(
    words: string[],
  ): Array<
    Pick<Prisma.WordCreateManyInput, 'answer' | 'normalizedAnswer' | 'category'>
  > {
    const normalizedWords = new Map<
      string,
      Pick<
        Prisma.WordCreateManyInput,
        'answer' | 'normalizedAnswer' | 'category'
      >
    >();

    for (const word of words) {
      const answer = word.trim();
      const normalizedAnswer = answer.toLocaleLowerCase('ko-KR');

      if (answer.length === 0 || answer.length > MAX_WORD_LENGTH) {
        continue;
      }

      normalizedWords.set(normalizedAnswer, {
        answer,
        normalizedAnswer,
        category: WORD_POOL_CATEGORY,
      });
    }

    return [...normalizedWords.values()];
  }
}
