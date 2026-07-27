import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { KimiService } from '@/words/providers/kimi.service';
import { WordsController } from '@/words/words.controller';
import { WordsService } from '@/words/words.service';

@Module({
  imports: [AuthModule],
  controllers: [WordsController],
  providers: [KimiService, WordsService],
  exports: [WordsService],
})
export class WordsModule {}
