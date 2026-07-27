import { Test, TestingModule } from '@nestjs/testing';
import { WordDifficulty } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { WORD_POOL_WEEKLY_REPLACEMENT } from '@/words/constants/word.constants';
import { KimiService } from '@/words/providers/kimi.service';
import { WordsService } from '@/words/words.service';

describe('WordsService', () => {
  let service: WordsService;
  let kimiService: { generateWords: jest.Mock };
  let prisma: {
    word: {
      count: jest.Mock;
      createMany: jest.Mock;
      findMany: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    kimiService = {
      generateWords: jest.fn(),
    };
    prisma = {
      word: {
        count: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      (callback: (transaction: typeof prisma) => unknown) => callback(prisma),
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordsService,
        { provide: PrismaService, useValue: prisma },
        { provide: KimiService, useValue: kimiService },
      ],
    }).compile();

    service = module.get(WordsService);
  });

  it('난이도별 목표 수량에서 부족한 제시어만 보충한다', async () => {
    prisma.word.count
      .mockResolvedValueOnce(139)
      .mockResolvedValueOnce(50)
      .mockResolvedValueOnce(10);
    prisma.word.findMany.mockResolvedValue([]);
    prisma.word.createMany.mockResolvedValue({ count: 1 });
    kimiService.generateWords.mockResolvedValue(['고양이']);

    await service.ensurePool();

    expect(kimiService.generateWords).toHaveBeenCalledTimes(1);
    expect(kimiService.generateWords).toHaveBeenCalledWith({
      count: 1,
      category: '전체',
      difficulty: WordDifficulty.EASY,
    });
    expect(prisma.word.createMany).toHaveBeenCalledWith({
      data: [
        {
          answer: '고양이',
          normalizedAnswer: '고양이',
          category: '전체',
          difficulty: WordDifficulty.EASY,
        },
      ],
      skipDuplicates: true,
    });
  });

  it('새로 저장된 개수만큼 기존 제시어를 비활성화한다', async () => {
    kimiService.generateWords.mockImplementation(
      ({ count, difficulty }: { count: number; difficulty: WordDifficulty }) =>
        Promise.resolve(
          Array.from(
            { length: count },
            (_, index) => `${difficulty}-${index + 1}`,
          ),
        ),
    );
    prisma.word.findMany.mockImplementation(
      (args: { select?: { normalizedAnswer?: boolean }; take?: number }) => {
        if (args.select?.normalizedAnswer) {
          return Promise.resolve([]);
        }

        return Promise.resolve(
          Array.from({ length: args.take ?? 0 }, (_, index) => ({
            id: `old-${index + 1}`,
          })),
        );
      },
    );
    prisma.word.createMany.mockImplementation(({ data }: { data: unknown[] }) =>
      Promise.resolve({ count: data.length }),
    );
    prisma.word.updateMany.mockImplementation(
      ({ where }: { where: { id: { in: string[] } } }) =>
        Promise.resolve({ count: where.id.in.length }),
    );

    await service.rotatePool();

    expect(kimiService.generateWords).toHaveBeenCalledTimes(3);
    expect(prisma.word.updateMany).toHaveBeenCalledTimes(3);
    expect(kimiService.generateWords).toHaveBeenNthCalledWith(1, {
      count: WORD_POOL_WEEKLY_REPLACEMENT.EASY,
      category: '전체',
      difficulty: WordDifficulty.EASY,
    });
    expect(kimiService.generateWords).toHaveBeenNthCalledWith(2, {
      count: WORD_POOL_WEEKLY_REPLACEMENT.MEDIUM,
      category: '전체',
      difficulty: WordDifficulty.MEDIUM,
    });
    expect(kimiService.generateWords).toHaveBeenNthCalledWith(3, {
      count: WORD_POOL_WEEKLY_REPLACEMENT.HARD,
      category: '전체',
      difficulty: WordDifficulty.HARD,
    });
  });
});
