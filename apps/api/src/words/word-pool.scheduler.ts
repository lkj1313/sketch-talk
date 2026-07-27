import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  WORD_POOL_TIME_ZONE,
  WORD_POOL_WEEKLY_CRON,
} from '@/words/constants/word.constants';
import { WordsService } from '@/words/words.service';

@Injectable()
export class WordPoolScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(WordPoolScheduler.name);
  private readonly enabled: boolean;
  private isRunning = false;

  constructor(
    configService: ConfigService,
    private readonly wordsService: WordsService,
  ) {
    this.enabled =
      configService.get<string>('WORD_AUTO_GENERATION_ENABLED', 'false') ===
      'true';
  }

  onApplicationBootstrap(): void {
    if (!this.enabled) {
      this.logger.log('제시어 자동 생성이 비활성화되어 있습니다.');
      return;
    }

    void this.runJob('최초 제시어 보충', () => this.wordsService.ensurePool());
  }

  @Cron(WORD_POOL_WEEKLY_CRON, { timeZone: WORD_POOL_TIME_ZONE })
  async handleWeeklyRotation(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    await this.runJob('주간 제시어 교체', async () => {
      await this.wordsService.ensurePool();
      await this.wordsService.rotatePool();
    });
  }

  private async runJob(name: string, job: () => Promise<void>): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(`${name} 작업을 건너뜁니다. 이미 작업이 실행 중입니다.`);
      return;
    }

    this.isRunning = true;
    this.logger.log(`${name} 작업을 시작합니다.`);

    try {
      await job();
      this.logger.log(`${name} 작업을 완료했습니다.`);
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`${name} 작업에 실패했습니다.`, stack);
    } finally {
      this.isRunning = false;
    }
  }
}
