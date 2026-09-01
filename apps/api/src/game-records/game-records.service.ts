import type { MemberGameRecordResponse } from '@sketch-talk/contracts';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

const RECENT_GAME_LIMIT = 20;

@Injectable()
export class GameRecordsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberRecord(userId: string): Promise<MemberGameRecordResponse> {
    const [gamesPlayed, wins, scoreAggregate, recentResults] =
      await Promise.all([
        this.prisma.gamePlayerResult.count({ where: { userId } }),
        this.prisma.gamePlayerResult.count({ where: { userId, rank: 1 } }),
        this.prisma.gamePlayerResult.aggregate({
          where: { userId },
          _sum: { score: true },
          _max: { score: true },
        }),
        this.prisma.gamePlayerResult.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: RECENT_GAME_LIMIT,
          select: {
            gameSessionId: true,
            score: true,
            rank: true,
            createdAt: true,
            gameSession: {
              select: {
                roomTitle: true,
                endedAt: true,
                _count: { select: { playerResults: true } },
              },
            },
          },
        }),
      ]);

    return {
      stats: {
        gamesPlayed,
        wins,
        totalScore: scoreAggregate._sum.score ?? 0,
        bestScore: scoreAggregate._max.score ?? 0,
      },
      recentGames: recentResults.map((result) => ({
        gameSessionId: result.gameSessionId,
        roomTitle: result.gameSession.roomTitle,
        score: result.score,
        rank: result.rank,
        playerCount: result.gameSession._count.playerResults,
        endedAt: (result.gameSession.endedAt ?? result.createdAt).toISOString(),
      })),
    };
  }
}
