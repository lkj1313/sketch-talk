import { Test, TestingModule } from '@nestjs/testing';
import { AppException } from '@/common/exceptions/app.exception';
import { WordDifficulty } from '@/words/constants/word.constants';
import { GenerateWordsDto } from '@/words/dto/generate-words.dto';
import { KimiService } from '@/words/providers/kimi.service';
import { WordsService } from '@/words/words.service';

describe('WordsService', () => {
  let service: WordsService;
  let kimiService: { generateWords: jest.Mock };

  beforeEach(async () => {
    kimiService = {
      generateWords: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordsService,
        {
          provide: KimiService,
          useValue: kimiService,
        },
      ],
    }).compile();

    service = module.get(WordsService);
  });

  it('생성된 제시어를 응답 DTO로 변환한다', async () => {
    const dto = Object.assign(new GenerateWordsDto(), {
      count: 2,
      category: '동물',
      difficulty: WordDifficulty.EASY,
    });
    kimiService.generateWords.mockResolvedValue(['고양이', ' 강아지 ']);

    const result = await service.generate(dto);

    expect(result.words).toEqual([
      {
        answer: '고양이',
        category: '동물',
        difficulty: WordDifficulty.EASY,
      },
      {
        answer: '강아지',
        category: '동물',
        difficulty: WordDifficulty.EASY,
      },
    ]);
  });

  it('중복 제거 후 개수가 부족하면 예외를 던진다', async () => {
    const dto = Object.assign(new GenerateWordsDto(), { count: 2 });
    kimiService.generateWords.mockResolvedValue(['고양이', '고양이']);

    await expect(service.generate(dto)).rejects.toBeInstanceOf(AppException);
  });
});
