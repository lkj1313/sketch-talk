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
  const service = new GamesService({} as never);
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
      Promise.resolve({
        id: 'round-id',
        startedAt: data.startedAt,
        expiresAt: data.expiresAt,
      }),
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
        expiresAt: expect.any(Date),
      },
      select: {
        id: true,
        startedAt: true,
        expiresAt: true,
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
        expiresAt: expect.any(String),
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

describe('GamesService.assertCanDraw', () => {
  const gameRoundFindFirst = jest.fn();
  let service: GamesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GamesService({
      gameRound: { findFirst: gameRoundFindFirst },
    } as never);
    gameRoundFindFirst.mockResolvedValue({
      roundNumber: 1,
      status: 'DRAWING',
      expiresAt: new Date(Date.now() + 120_000),
      drawerParticipantId: 'drawer-id',
      gameSession: { currentRoundNumber: 1 },
    });
  });

  it('현재 라운드의 출제자에게 그림 전송을 허용한다', async () => {
    await expect(
      service.assertCanDraw('ABC234', 'drawer-id', 'round-id'),
    ).resolves.toBeUndefined();

    expect(gameRoundFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'round-id',
        gameSession: {
          status: 'PLAYING',
          room: {
            code: 'ABC234',
            participants: { some: { id: 'drawer-id' } },
          },
        },
      },
      select: {
        roundNumber: true,
        status: true,
        expiresAt: true,
        drawerParticipantId: true,
        gameSession: { select: { currentRoundNumber: true } },
      },
    });
  });

  it('출제자가 아닌 참가자의 그림 전송을 거부한다', async () => {
    const error: unknown = await service
      .assertCanDraw('ABC234', 'participant-id', 'round-id')
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AppException);
    if (!(error instanceof AppException)) {
      throw new Error('AppException이 발생해야 합니다.');
    }
    expect(error.getStatus()).toBe(HttpStatus.FORBIDDEN);
    expect(error.getResponse()).toEqual({
      code: 'GAME_DRAWING_NOT_ALLOWED',
      message: '현재 출제자만 그림을 그릴 수 있습니다.',
    });
  });

  it('동일 출제자의 반복 요청은 짧은 시간 동안 권한 조회 결과를 재사용한다', async () => {
    await service.assertCanDraw('ABC234', 'drawer-id', 'round-id');
    await service.assertCanDraw('ABC234', 'drawer-id', 'round-id');

    expect(gameRoundFindFirst).toHaveBeenCalledTimes(1);
  });
});

describe('GamesService.getReconnectState', () => {
  const gameRoundFindFirst = jest.fn();
  const service = new GamesService({
    gameRound: { findFirst: gameRoundFindFirst },
  } as never);
  const startedAt = new Date();
  const expiresAt = new Date(Date.now() + 120_000);

  beforeEach(() => {
    jest.clearAllMocks();
    gameRoundFindFirst.mockResolvedValue({
      id: 'round-id',
      roundNumber: 1,
      difficultySnapshot: WordDifficulty.EASY,
      startedAt,
      expiresAt,
      answerSnapshot: '고양이',
      drawerParticipantId: 'drawer-id',
      drawerParticipant: {
        id: 'drawer-id',
        nickname: '출제자',
      },
      gameSession: {
        id: 'game-session-id',
        totalRounds: 2,
        currentRoundNumber: 1,
      },
    });
  });

  it('일반 참가자에게 현재 라운드의 공개 상태를 반환한다', async () => {
    const result = await service.getReconnectState('ABC234', 'participant-id');

    expect(result).toEqual({
      game: {
        gameSessionId: 'game-session-id',
        roundId: 'round-id',
        roundNumber: 1,
        totalRounds: 2,
        drawer: { id: 'drawer-id', nickname: '출제자' },
        difficulty: WordDifficulty.EASY,
        startedAt: startedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
    });
  });

  it('재접속한 출제자에게만 현재 제시어를 함께 반환한다', async () => {
    const result = await service.getReconnectState('ABC234', 'drawer-id');

    expect(result).toEqual(
      expect.objectContaining({
        wordAssignment: {
          gameSessionId: 'game-session-id',
          roundId: 'round-id',
          answer: '고양이',
        },
      }),
    );
  });
});

describe('GamesService.handleParticipantLeave', () => {
  const gameSessionFindFirst = jest.fn();
  const gameSessionUpdate = jest.fn();
  const gameRoundFindUnique = jest.fn();
  const gameRoundUpdateMany = jest.fn();
  const gameRoundCreate = jest.fn();
  const roomUpdate = jest.fn();
  const wordFindMany = jest.fn();
  const wordUpdate = jest.fn();
  const transaction = {
    gameSession: {
      findFirst: gameSessionFindFirst,
      update: gameSessionUpdate,
    },
    gameRound: {
      findUnique: gameRoundFindUnique,
      updateMany: gameRoundUpdateMany,
      create: gameRoundCreate,
    },
    room: { update: roomUpdate },
    word: { findMany: wordFindMany, update: wordUpdate },
    roomParticipant: { findMany: jest.fn() },
  };
  const service = new GamesService({} as never);
  const remainingParticipants = [
    { id: 'participant-2', nickname: '참가자2', score: 50 },
    { id: 'participant-3', nickname: '참가자3', score: 100 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    gameSessionFindFirst.mockResolvedValue({
      id: 'game-session-id',
      roomId: 'room-id',
      totalRounds: 3,
      currentRoundNumber: 1,
    });
    gameRoundFindUnique.mockResolvedValue({
      id: 'round-id',
      status: 'DRAWING',
      answerSnapshot: '고양이',
      drawerParticipantId: 'leaving-drawer-id',
    });
    gameRoundUpdateMany.mockResolvedValue({ count: 1 });
    wordFindMany.mockResolvedValue([
      {
        id: 'next-word-id',
        answer: '강아지',
        difficulty: WordDifficulty.EASY,
      },
    ]);
    gameRoundCreate.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'next-round-id',
        startedAt: data.startedAt,
        expiresAt: data.expiresAt,
      }),
    );
    gameSessionUpdate.mockResolvedValue({});
    roomUpdate.mockResolvedValue({});
    wordUpdate.mockResolvedValue({});
  });

  it('현재 출제자가 나가면 라운드를 건너뛰고 다음 라운드를 시작한다', async () => {
    const result = await service.handleParticipantLeave(
      transaction as never,
      { id: 'room-id', code: 'ABC234' },
      'leaving-drawer-id',
      remainingParticipants,
    );

    expect(gameRoundUpdateMany).toHaveBeenCalledWith({
      where: { id: 'round-id', status: 'DRAWING' },
      data: { status: 'SKIPPED', endedAt: expect.any(Date) },
    });
    expect(result).toEqual(
      expect.objectContaining({
        roomCode: 'ABC234',
        type: 'NEXT',
        skipped: {
          gameSessionId: 'game-session-id',
          roundId: 'round-id',
          answer: '고양이',
          reason: 'DRAWER_LEFT',
        },
        nextRound: expect.objectContaining({
          roundNumber: 2,
          drawer: { id: 'participant-3', nickname: '참가자3' },
        }),
      }),
    );
  });

  it('남은 참가자가 두 명 미만이면 진행 중인 게임을 종료한다', async () => {
    const result = await service.handleParticipantLeave(
      transaction as never,
      { id: 'room-id', code: 'ABC234' },
      'leaving-drawer-id',
      [remainingParticipants[0]],
    );

    expect(gameSessionUpdate).toHaveBeenCalledWith({
      where: { id: 'game-session-id' },
      data: { status: 'CANCELLED', endedAt: expect.any(Date) },
    });
    expect(roomUpdate).toHaveBeenCalledWith({
      where: { id: 'room-id' },
      data: { status: 'FINISHED', endedAt: expect.any(Date) },
    });
    expect(result).toEqual(
      expect.objectContaining({
        type: 'FINISHED',
        finished: expect.objectContaining({
          reason: 'NOT_ENOUGH_PARTICIPANTS',
          scores: [
            {
              participantId: 'participant-2',
              nickname: '참가자2',
              score: 50,
            },
          ],
        }),
      }),
    );
    expect(gameRoundCreate).not.toHaveBeenCalled();
  });

  it('출제자가 아닌 참가자가 나가고 두 명 이상 남으면 게임을 계속한다', async () => {
    const result = await service.handleParticipantLeave(
      transaction as never,
      { id: 'room-id', code: 'ABC234' },
      'participant-2',
      remainingParticipants,
    );

    expect(result).toBeNull();
    expect(gameRoundUpdateMany).not.toHaveBeenCalled();
  });
});

describe('GamesService.submitMessage', () => {
  const roomParticipantFindFirst = jest.fn();
  const roomParticipantFindMany = jest.fn();
  const roomParticipantUpdate = jest.fn();
  const gameSessionFindFirst = jest.fn();
  const gameSessionUpdate = jest.fn();
  const gameRoundFindUnique = jest.fn();
  const gameRoundUpdateMany = jest.fn();
  const gameRoundCreate = jest.fn();
  const wordFindMany = jest.fn();
  const wordUpdate = jest.fn();
  const roomUpdate = jest.fn();
  const transaction = {
    roomParticipant: {
      findFirst: roomParticipantFindFirst,
      findMany: roomParticipantFindMany,
      update: roomParticipantUpdate,
    },
    gameSession: {
      findFirst: gameSessionFindFirst,
      update: gameSessionUpdate,
    },
    gameRound: {
      findUnique: gameRoundFindUnique,
      updateMany: gameRoundUpdateMany,
      create: gameRoundCreate,
    },
    word: {
      findMany: wordFindMany,
      update: wordUpdate,
    },
    room: {
      update: roomUpdate,
    },
  };
  const prisma = {
    $transaction: jest.fn(
      (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    ),
  };
  const service = new GamesService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    roomParticipantFindFirst.mockResolvedValue({
      id: 'guesser-id',
      nickname: '정답자',
      roomId: 'room-id',
    });
    gameSessionFindFirst.mockResolvedValue({
      id: 'game-session-id',
      roomId: 'room-id',
      totalRounds: 2,
      currentRoundNumber: 1,
    });
    gameRoundFindUnique.mockResolvedValue({
      id: 'round-id',
      answerSnapshot: '고양이',
      difficultySnapshot: WordDifficulty.EASY,
      status: 'DRAWING',
      expiresAt: new Date(Date.now() + 120_000),
      drawerParticipantId: 'drawer-id',
      drawerParticipant: {
        id: 'drawer-id',
        nickname: '출제자',
      },
    });
    gameRoundUpdateMany.mockResolvedValue({ count: 1 });
    roomParticipantUpdate.mockResolvedValue({});
    roomParticipantFindMany.mockResolvedValue([
      { id: 'drawer-id', nickname: '출제자' },
      { id: 'guesser-id', nickname: '정답자' },
    ]);
    wordFindMany.mockResolvedValue([
      {
        id: 'next-word-id',
        answer: '강아지',
        difficulty: WordDifficulty.MEDIUM,
      },
    ]);
    gameRoundCreate.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'next-round-id',
        startedAt: data.startedAt,
        expiresAt: data.expiresAt,
      }),
    );
    gameSessionUpdate.mockResolvedValue({});
    wordUpdate.mockResolvedValue({});
    roomUpdate.mockResolvedValue({});
  });

  it('일반 메시지는 점수 처리 없이 채팅 이벤트로 반환한다', async () => {
    const result = await service.submitMessage(
      'ABC234',
      'guesser-id',
      '안녕하세요',
    );

    expect(result).toEqual({
      type: 'CHAT',
      chat: {
        participant: { id: 'guesser-id', nickname: '정답자' },
        message: '안녕하세요',
        sentAt: expect.any(String),
      },
    });
    expect(gameRoundUpdateMany).not.toHaveBeenCalled();
    expect(roomParticipantUpdate).not.toHaveBeenCalled();
  });

  it('정답이면 난이도 점수를 지급하고 다음 라운드를 생성한다', async () => {
    const result = await service.submitMessage(
      'ABC234',
      'guesser-id',
      ' 고 양 이 ',
    );

    expect(gameRoundUpdateMany).toHaveBeenCalledWith({
      where: { id: 'round-id', status: 'DRAWING' },
      data: {
        status: 'FINISHED',
        guessedByParticipantId: 'guesser-id',
        guesserScore: 100,
        drawerScore: 50,
        endedAt: expect.any(Date),
      },
    });
    expect(roomParticipantUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: 'guesser-id' },
      data: { score: { increment: 100 } },
    });
    expect(roomParticipantUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: 'drawer-id' },
      data: { score: { increment: 50 } },
    });
    expect(gameRoundCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        gameSessionId: 'game-session-id',
        wordId: 'next-word-id',
        drawerParticipantId: 'guesser-id',
        roundNumber: 2,
        answerSnapshot: '강아지',
        difficultySnapshot: WordDifficulty.MEDIUM,
      }),
      select: { id: true, startedAt: true, expiresAt: true },
    });
    expect(result).toEqual(
      expect.objectContaining({
        type: 'CORRECT',
        correctAnswer: expect.objectContaining({
          answer: '고양이',
          guesser: expect.objectContaining({ awardedScore: 100 }),
          drawer: expect.objectContaining({ awardedScore: 50 }),
        }),
        nextRound: expect.objectContaining({
          roundNumber: 2,
          drawer: { id: 'guesser-id', nickname: '정답자' },
        }),
        wordAssignment: expect.objectContaining({ answer: '강아지' }),
      }),
    );
  });

  it('마지막 라운드 정답이면 게임과 방을 종료한다', async () => {
    gameSessionFindFirst.mockResolvedValue({
      id: 'game-session-id',
      roomId: 'room-id',
      totalRounds: 1,
      currentRoundNumber: 1,
    });
    roomParticipantFindMany.mockResolvedValue([
      { id: 'guesser-id', nickname: '정답자', score: 100 },
      { id: 'drawer-id', nickname: '출제자', score: 50 },
    ]);

    const result = await service.submitMessage(
      'ABC234',
      'guesser-id',
      '고양이',
    );

    expect(gameSessionUpdate).toHaveBeenCalledWith({
      where: { id: 'game-session-id' },
      data: { status: 'FINISHED', endedAt: expect.any(Date) },
    });
    expect(roomUpdate).toHaveBeenCalledWith({
      where: { id: 'room-id' },
      data: { status: 'FINISHED', endedAt: expect.any(Date) },
    });
    expect(result).toEqual(
      expect.objectContaining({
        type: 'FINISHED',
        finished: expect.objectContaining({
          gameSessionId: 'game-session-id',
          scores: [
            {
              participantId: 'guesser-id',
              nickname: '정답자',
              score: 100,
            },
            {
              participantId: 'drawer-id',
              nickname: '출제자',
              score: 50,
            },
          ],
        }),
      }),
    );
    expect(gameRoundCreate).not.toHaveBeenCalled();
  });

  it('120초가 지난 라운드를 건너뛰고 다음 라운드를 생성한다', async () => {
    gameRoundFindUnique.mockResolvedValue({
      id: 'round-id',
      roundNumber: 1,
      status: 'DRAWING',
      expiresAt: new Date(Date.now() - 1_000),
      answerSnapshot: '고양이',
      gameSession: {
        id: 'game-session-id',
        roomId: 'room-id',
        totalRounds: 2,
        currentRoundNumber: 1,
        status: 'PLAYING',
        room: { code: 'ABC234' },
      },
    });

    const result = await service.expireRound('round-id');

    expect(gameRoundUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'round-id',
        status: 'DRAWING',
        expiresAt: { lte: expect.any(Date) },
      },
      data: {
        status: 'SKIPPED',
        endedAt: expect.any(Date),
      },
    });
    expect(roomParticipantUpdate).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        roomCode: 'ABC234',
        type: 'NEXT',
        timedOut: {
          gameSessionId: 'game-session-id',
          roundId: 'round-id',
          answer: '고양이',
        },
        nextRound: expect.objectContaining({
          roundNumber: 2,
          expiresAt: expect.any(String),
        }),
      }),
    );
  });
});
