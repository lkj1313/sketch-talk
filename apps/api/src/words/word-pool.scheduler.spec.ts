import { ConfigService } from '@nestjs/config';
import { WordPoolScheduler } from '@/words/word-pool.scheduler';
import { WordsService } from '@/words/words.service';

describe('WordPoolScheduler', () => {
  const createScheduler = (enabled: boolean) => {
    const configService = {
      get: jest.fn().mockReturnValue(String(enabled)),
    };
    const wordsService = {
      ensurePool: jest.fn().mockResolvedValue(undefined),
      rotatePool: jest.fn().mockResolvedValue(undefined),
    };
    const scheduler = new WordPoolScheduler(
      configService as unknown as ConfigService,
      wordsService as unknown as WordsService,
    );

    return { scheduler, wordsService };
  };

  it('자동 생성이 활성화되면 주간 작업에서 부족분 보충 후 교체한다', async () => {
    const { scheduler, wordsService } = createScheduler(true);

    await scheduler.handleWeeklyRotation();

    expect(wordsService.ensurePool).toHaveBeenCalledTimes(1);
    expect(wordsService.rotatePool).toHaveBeenCalledTimes(1);
    expect(wordsService.ensurePool.mock.invocationCallOrder[0]).toBeLessThan(
      wordsService.rotatePool.mock.invocationCallOrder[0],
    );
  });

  it('자동 생성이 비활성화되면 주간 작업을 실행하지 않는다', async () => {
    const { scheduler, wordsService } = createScheduler(false);

    await scheduler.handleWeeklyRotation();

    expect(wordsService.ensurePool).not.toHaveBeenCalled();
    expect(wordsService.rotatePool).not.toHaveBeenCalled();
  });

  it('보충 작업이 실패하면 기존 제시어 교체를 진행하지 않는다', async () => {
    const { scheduler, wordsService } = createScheduler(true);
    wordsService.ensurePool.mockRejectedValue(new Error('generation failed'));

    await expect(scheduler.handleWeeklyRotation()).resolves.toBeUndefined();

    expect(wordsService.rotatePool).not.toHaveBeenCalled();
  });
});
