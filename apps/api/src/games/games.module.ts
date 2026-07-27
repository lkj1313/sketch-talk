import { Module } from '@nestjs/common';
import { GamesService } from '@/games/games.service';
import { GameRoundScheduler } from '@/games/game-round.scheduler';

@Module({
  providers: [GamesService, GameRoundScheduler],
  exports: [GamesService],
})
export class GamesModule {}
