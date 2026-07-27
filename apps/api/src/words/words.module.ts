import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { KimiService } from '@/words/providers/kimi.service';
import { WordPoolScheduler } from '@/words/word-pool.scheduler';
import { WordsService } from '@/words/words.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [KimiService, WordsService, WordPoolScheduler],
  exports: [WordsService],
})
export class WordsModule {}
