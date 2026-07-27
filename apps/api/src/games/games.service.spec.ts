import { HttpStatus } from '@nestjs/common';
import { AppException } from '@/common/exceptions/app.exception';
import { WordDifficulty } from '@/generated/prisma/client';
import { GamesService } from '@/games/games.service';

describe('GamesService', () => {
  const wordFindMany = jest.fn();
  const wordUpdate = jest.fn();
  const gameSessionCreate = jest.fn();
  const gameRoundCreate = jest.fn();
  const transaction = {
    word: {
      findMany: wordFindMany,
      update: wordUpdate,
    },
    gameSession: {
      create: gameSessionCreate,
    },
    gameRound: {
      create: gameRoundCreate,
    },
  };
  const service = new GamesService();
  const room = {
    id: 'room-id',
    code: 'ABC234',
    title: '같이 게임해요',
    participants: [
      { id: 'host-id', nickname: '방장' },
      { id: 'participant-id', nickname: '참가자' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    wordFindMany.mockResolvedValue([
      {
        id: 'word-id',
        answer: '고양이',
        difficulty: WordDifficulty.EASY,
      },
    ]);
    gameSessionCreate.mockResolvedValue({ id: 'game-session-id' });
    gameRoundCreate.mockImplementation(({ data }) =>
      Promise.resolve({ id: 'round-id', startedAt: data.startedAt }),
    );
    wordUpdate.mockResolvedValue({ id: 'word-id' });
  });

  it('게임 세션과 첫 라운드를 생성하고 제시어 사용 정보를 갱신한다', async () => {
    const result = await service.start(transaction as never, room);

    expect(gameSessionCreate).toHaveBeenCalledWith({
      data: {
        roomId: room.id,
        roomCode: room.code,
        roomTitle: room.title,
        totalRounds: 2,
        currentRoundNumber: 1,
        startedAt: expect.any(Date),
      },
      select: { id: true },
    });
    expect(gameRoundCreate).toHaveBeenCalledWith({
      data: {
        gameSessionId: 'game-session-id',
        wordId: 'word-id',
        drawerParticipantId: 'host-id',
        roundNumber: 1,
        answerSnapshot: '고양이',
        difficultySnapshot: WordDifficulty.EASY,
        startedAt: expect.any(Date),
      },
      select: {
        id: true,
        startedAt: true,
      },
    });
    expect(wordUpdate).toHaveBeenCalledWith({
      where: { id: 'word-id' },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: expect.any(Date),
      },
    });
    expect(result).toEqual({
      game: {
        gameSessionId: 'game-session-id',
        roundId: 'round-id',
        roundNumber: 1,
        totalRounds: 2,
        drawer: room.participants[0],
        difficulty: WordDifficulty.EASY,
        startedAt: expect.any(String),
      },
      drawerParticipantId: 'host-id',
      wordAssignment: {
        gameSessionId: 'game-session-id',
        roundId: 'round-id',
        answer: '고양이',
      },
    });
  });

  it('활성 제시어가 없으면 게임을 시작하지 않는다', async () => {
    wordFindMany.mockResolvedValue([]);

    const error: unknown = await service
      .start(transaction as never, room)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppException);
    if (!(error instanceof AppException)) {
      throw new Error('AppException이 발생해야 합니다.');
    }
    expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(error.getResponse()).toEqual({
      code: 'GAME_WORD_POOL_EMPTY',
      message: '사용할 수 있는 제시어가 없어 게임을 시작할 수 없습니다.',
    });
    expect(gameSessionCreate).not.toHaveBeenCalled();
    expect(gameRoundCreate).not.toHaveBeenCalled();
  });
});
