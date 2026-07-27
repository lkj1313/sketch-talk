import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { GameRoundStatus } from '@/generated/prisma/client';
import { GAME_ROUND_EXPIRATION_CHECK_INTERVAL_MS } from '@/games/constants/game.constants';
import { GAME_DOMAIN_EVENT } from '@/games/events/game.events';
import { GamesService } from '@/games/games.service';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class GameRoundScheduler {
  private readonly logger = new Logger(GameRoundScheduler.name);
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gamesService: GamesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Interval(GAME_ROUND_EXPIRATION_CHECK_INTERVAL_MS)
  async handleExpiredRounds(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const expiredRounds = await this.prisma.gameRound.findMany({
        where: {
          status: GameRoundStatus.DRAWING,
          expiresAt: { lte: new Date() },
        },
        orderBy: { expiresAt: 'asc' },
        take: 100,
        select: { id: true },
      });

      for (const round of expiredRounds) {
        try {
          const result = await this.gamesService.expireRound(round.id);

          if (result) {
            this.eventEmitter.emit(GAME_DOMAIN_EVENT.ROUND_TIMED_OUT, result);
          }
        } catch (error) {
          const stack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `만료 라운드 처리에 실패했습니다. roundId=${round.id}`,
            stack,
          );
        }
      }
    } catch (error) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('만료 라운드 조회에 실패했습니다.', stack);
    } finally {
      this.isRunning = false;
    }
  }
}
