import { GameRecordsService } from '@/game-records/game-records.service';

describe('GameRecordsService', () => {
  const gamePlayerResultCount = jest.fn();
  const gamePlayerResultAggregate = jest.fn();
  const gamePlayerResultFindMany = jest.fn();
  const service = new GameRecordsService({
    gamePlayerResult: {
      count: gamePlayerResultCount,
      aggregate: gamePlayerResultAggregate,
      findMany: gamePlayerResultFindMany,
    },
  } as never);

  beforeEach(() => {
    jest.clearAllMocks();
    gamePlayerResultCount.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    gamePlayerResultAggregate.mockResolvedValue({
      _sum: { score: 450 },
      _max: { score: 200 },
    });
    gamePlayerResultFindMany.mockResolvedValue([
      {
        gameSessionId: 'game-session-id',
        score: 200,
        rank: 1,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        gameSession: {
          roomTitle: '즐거운 그림방',
          endedAt: new Date('2026-09-01T00:10:00.000Z'),
          _count: { playerResults: 4 },
        },
      },
    ]);
  });

  it('회원의 누적 통계와 최근 게임 기록을 반환한다', async () => {
    const result = await service.getMemberRecord('user-id');

    expect(result).toEqual({
      stats: {
        gamesPlayed: 3,
        wins: 1,
        totalScore: 450,
        bestScore: 200,
      },
      recentGames: [
        {
          gameSessionId: 'game-session-id',
          roomTitle: '즐거운 그림방',
          score: 200,
          rank: 1,
          playerCount: 4,
          endedAt: '2026-09-01T00:10:00.000Z',
        },
      ],
    });
  });
});
