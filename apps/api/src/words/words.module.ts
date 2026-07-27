import { Module } from '@nestjs/common';
import { KimiService } from '@/words/providers/kimi.service';
import { WordPoolScheduler } from '@/words/word-pool.scheduler';
import { WordsService } from '@/words/words.service';

@Module({
  providers: [KimiService, WordsService, WordPoolScheduler],
  exports: [WordsService],
})
export class WordsModule {}
