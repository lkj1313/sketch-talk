import type { EventEmitter2 } from '@nestjs/event-emitter';
import { GAME_DOMAIN_EVENT } from '@/games/events/game.events';
import { GameRoundScheduler } from '@/games/game-round.scheduler';
import type { GamesService } from '@/games/games.service';
import type { PrismaService } from '@/prisma/prisma.service';

describe('GameRoundScheduler', () => {
  const gameRoundFindMany = jest.fn();
  const expireRound = jest.fn();
  const emit = jest.fn();
  const prisma = {
    gameRound: { findMany: gameRoundFindMany },
  } as unknown as PrismaService;
  const gamesService = {
    expireRound,
  } as unknown as GamesService;
  const eventEmitter = { emit } as unknown as EventEmitter2;
  const scheduler = new GameRoundScheduler(prisma, gamesService, eventEmitter);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('만료된 DRAWING 라운드를 처리하고 실시간 도메인 이벤트를 발행한다', async () => {
    const result = {
      roomCode: 'ABC234',
      type: 'FINISHED',
      timedOut: {
        gameSessionId: 'game-session-id',
        roundId: 'round-id',
        answer: '고양이',
      },
      finished: {
        gameSessionId: 'game-session-id',
        scores: [],
        endedAt: new Date().toISOString(),
      },
    };
    gameRoundFindMany.mockResolvedValue([{ id: 'round-id' }]);
    expireRound.mockResolvedValue(result);

    await scheduler.handleExpiredRounds();

    expect(gameRoundFindMany).toHaveBeenCalledWith({
      where: {
        status: 'DRAWING',
        expiresAt: { lte: expect.any(Date) },
      },
      orderBy: { expiresAt: 'asc' },
      take: 100,
      select: { id: true },
    });
    expect(expireRound).toHaveBeenCalledWith('round-id');
    expect(emit).toHaveBeenCalledWith(
      GAME_DOMAIN_EVENT.ROUND_TIMED_OUT,
      result,
    );
  });
});
