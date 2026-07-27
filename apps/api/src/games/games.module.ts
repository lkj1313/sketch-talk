import { Module } from '@nestjs/common';
import { GamesService } from '@/games/games.service';

@Module({
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
