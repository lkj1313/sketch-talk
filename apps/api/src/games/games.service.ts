import { Injectable } from '@nestjs/common';
import { AppException } from '@/common/exceptions/app.exception';
import {
  GameRoundStatus,
  GameSessionStatus,
  Prisma,
  RoomStatus,
} from '@/generated/prisma/client';
import {
  createRoundExpiresAt,
  DRAWER_SCORE_RATIO,
  GAME_DIFFICULTY_SCORE,
} from '@/games/constants/game.constants';
import { GAME_ERROR } from '@/games/constants/game-error.constants';
import type {
  AdvanceGameResult,
  ExpireGameRoundResult,
  SubmitGameMessageResult,
} from '@/games/types/game-message.type';
import type {
  StartGameResult,
  StartGameRoom,
} from '@/games/types/game-start.type';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async start(
    transaction: Prisma.TransactionClient,
    room: StartGameRoom,
  ): Promise<StartGameResult> {
    const words = await transaction.word.findMany({
      where: { isActive: true },
      select: {
        id: true,
        answer: true,
        difficulty: true,
      },
    });

    if (words.length === 0) {
      throw new AppException(GAME_ERROR.WORD_POOL_EMPTY);
    }

    const word = words[Math.floor(Math.random() * words.length)];
    const drawer = room.participants[0];
    const totalRounds = room.participants.length;
    const startedAt = new Date();
    const expiresAt = createRoundExpiresAt(startedAt);
    const gameSession = await transaction.gameSession.create({
      data: {
        roomId: room.id,
        roomCode: room.code,
        roomTitle: room.title,
        totalRounds,
        currentRoundNumber: 1,
        startedAt,
      },
      select: { id: true },
    });
    const round = await transaction.gameRound.create({
      data: {
        gameSessionId: gameSession.id,
        wordId: word.id,
        drawerParticipantId: drawer.id,
        roundNumber: 1,
        answerSnapshot: word.answer,
        difficultySnapshot: word.difficulty,
        startedAt,
        expiresAt,
      },
      select: {
        id: true,
        startedAt: true,
        expiresAt: true,
      },
    });

    await transaction.word.update({
      where: { id: word.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: startedAt,
      },
    });

    return {
      game: {
        gameSessionId: gameSession.id,
        roundId: round.id,
        roundNumber: 1,
        totalRounds,
        drawer,
        difficulty: word.difficulty,
        startedAt: round.startedAt.toISOString(),
        expiresAt: round.expiresAt.toISOString(),
      },
      drawerParticipantId: drawer.id,
      wordAssignment: {
        gameSessionId: gameSession.id,
        roundId: round.id,
        answer: word.answer,
      },
    };
  }

  async submitMessage(
    roomCode: string,
    participantId: string,
    message: string,
  ): Promise<SubmitGameMessageResult> {
    return this.prisma.$transaction(async (transaction) => {
      const participant = await transaction.roomParticipant.findFirst({
        where: {
          id: participantId,
          room: { code: roomCode },
        },
        select: {
          id: true,
          nickname: true,
          roomId: true,
        },
      });

      if (!participant) {
        throw new AppException(GAME_ERROR.PARTICIPANT_NOT_FOUND);
      }

      const gameSession = await transaction.gameSession.findFirst({
        where: {
          roomId: participant.roomId,
          status: GameSessionStatus.PLAYING,
        },
        orderBy: { startedAt: 'desc' },
        select: {
          id: true,
          roomId: true,
          totalRounds: true,
          currentRoundNumber: true,
        },
      });

      if (!gameSession || !gameSession.roomId) {
        throw new AppException(GAME_ERROR.NOT_PLAYING);
      }

      const round = await transaction.gameRound.findUnique({
        where: {
          gameSessionId_roundNumber: {
            gameSessionId: gameSession.id,
            roundNumber: gameSession.currentRoundNumber,
          },
        },
        select: {
          id: true,
          answerSnapshot: true,
          difficultySnapshot: true,
          status: true,
          expiresAt: true,
          drawerParticipantId: true,
          drawerParticipant: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      });

      if (
        !round ||
        round.status !== GameRoundStatus.DRAWING ||
        round.expiresAt <= new Date() ||
        !round.drawerParticipant ||
        !round.drawerParticipantId
      ) {
        throw new AppException(GAME_ERROR.ROUND_NOT_ACTIVE);
      }

      const isCorrect =
        participant.id !== round.drawerParticipantId &&
        this.normalizeAnswer(message) ===
          this.normalizeAnswer(round.answerSnapshot);

      if (!isCorrect) {
        return {
          type: 'CHAT',
          chat: {
            participant: {
              id: participant.id,
              nickname: participant.nickname,
            },
            message,
            sentAt: new Date().toISOString(),
          },
        };
      }

      return this.completeRound(
        transaction,
        { ...gameSession, roomId: gameSession.roomId },
        {
          ...round,
          drawerParticipantId: round.drawerParticipantId,
          drawerParticipant: round.drawerParticipant,
        },
        participant,
      );
    });
  }

  private async completeRound(
    transaction: Prisma.TransactionClient,
    gameSession: {
      id: string;
      roomId: string;
      totalRounds: number;
      currentRoundNumber: number;
    },
    round: {
      id: string;
      answerSnapshot: string;
      difficultySnapshot: keyof typeof GAME_DIFFICULTY_SCORE;
      drawerParticipantId: string;
      drawerParticipant: {
        id: string;
        nickname: string;
      };
    },
    guesser: {
      id: string;
      nickname: string;
    },
  ): Promise<SubmitGameMessageResult> {
    const endedAt = new Date();
    const guesserScore = GAME_DIFFICULTY_SCORE[round.difficultySnapshot];
    const drawerScore = Math.floor(guesserScore * DRAWER_SCORE_RATIO);
    const updatedRound = await transaction.gameRound.updateMany({
      where: {
        id: round.id,
        status: GameRoundStatus.DRAWING,
      },
      data: {
        status: GameRoundStatus.FINISHED,
        guessedByParticipantId: guesser.id,
        guesserScore,
        drawerScore,
        endedAt,
      },
    });

    if (updatedRound.count !== 1) {
      throw new AppException(GAME_ERROR.ROUND_NOT_ACTIVE);
    }

    await transaction.roomParticipant.update({
      where: { id: guesser.id },
      data: { score: { increment: guesserScore } },
    });
    await transaction.roomParticipant.update({
      where: { id: round.drawerParticipantId },
      data: { score: { increment: drawerScore } },
    });

    const correctAnswer = {
      gameSessionId: gameSession.id,
      roundId: round.id,
      answer: round.answerSnapshot,
      guesser: {
        id: guesser.id,
        nickname: guesser.nickname,
        awardedScore: guesserScore,
      },
      drawer: {
        id: round.drawerParticipant.id,
        nickname: round.drawerParticipant.nickname,
        awardedScore: drawerScore,
      },
    };
    const advance = await this.advanceGame(transaction, gameSession, endedAt);

    return advance.type === 'NEXT'
      ? {
          type: 'CORRECT',
          correctAnswer,
          nextRound: advance.nextRound,
          nextDrawerParticipantId: advance.nextDrawerParticipantId,
          wordAssignment: advance.wordAssignment,
        }
      : {
          type: 'FINISHED',
          correctAnswer,
          finished: advance.finished,
        };
  }

  async expireRound(roundId: string): Promise<ExpireGameRoundResult> {
    return this.prisma.$transaction(async (transaction) => {
      const round = await transaction.gameRound.findUnique({
        where: { id: roundId },
        select: {
          id: true,
          roundNumber: true,
          status: true,
          expiresAt: true,
          answerSnapshot: true,
          gameSession: {
            select: {
              id: true,
              roomId: true,
              totalRounds: true,
              currentRoundNumber: true,
              status: true,
              room: {
                select: { code: true },
              },
            },
          },
        },
      });
      const endedAt = new Date();

      if (
        !round ||
        round.status !== GameRoundStatus.DRAWING ||
        round.expiresAt > endedAt ||
        round.gameSession.status !== GameSessionStatus.PLAYING ||
        !round.gameSession.roomId ||
        !round.gameSession.room ||
        round.roundNumber !== round.gameSession.currentRoundNumber
      ) {
        return null;
      }

      const updated = await transaction.gameRound.updateMany({
        where: {
          id: round.id,
          status: GameRoundStatus.DRAWING,
          expiresAt: { lte: endedAt },
        },
        data: {
          status: GameRoundStatus.SKIPPED,
          endedAt,
        },
      });

      if (updated.count !== 1) {
        return null;
      }

      const advance = await this.advanceGame(
        transaction,
        {
          id: round.gameSession.id,
          roomId: round.gameSession.roomId,
          totalRounds: round.gameSession.totalRounds,
          currentRoundNumber: round.gameSession.currentRoundNumber,
        },
        endedAt,
      );

      return {
        roomCode: round.gameSession.room.code,
        timedOut: {
          gameSessionId: round.gameSession.id,
          roundId: round.id,
          answer: round.answerSnapshot,
        },
        ...advance,
      };
    });
  }

  private async advanceGame(
    transaction: Prisma.TransactionClient,
    gameSession: {
      id: string;
      roomId: string;
      totalRounds: number;
      currentRoundNumber: number;
    },
    endedAt: Date,
  ): Promise<AdvanceGameResult> {
    if (gameSession.currentRoundNumber >= gameSession.totalRounds) {
      await transaction.gameSession.update({
        where: { id: gameSession.id },
        data: {
          status: GameSessionStatus.FINISHED,
          endedAt,
        },
      });
      await transaction.room.update({
        where: { id: gameSession.roomId },
        data: {
          status: RoomStatus.FINISHED,
          endedAt,
        },
      });
      const scores = await transaction.roomParticipant.findMany({
        where: { roomId: gameSession.roomId },
        orderBy: [{ score: 'desc' }, { joinedAt: 'asc' }],
        select: {
          id: true,
          nickname: true,
          score: true,
        },
      });

      return {
        type: 'FINISHED',
        finished: {
          gameSessionId: gameSession.id,
          scores: scores.map((score) => ({
            participantId: score.id,
            nickname: score.nickname,
            score: score.score,
          })),
          endedAt: endedAt.toISOString(),
        },
      };
    }

    const nextRoundNumber = gameSession.currentRoundNumber + 1;
    const participants = await transaction.roomParticipant.findMany({
      where: { roomId: gameSession.roomId },
      orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        nickname: true,
      },
    });
    const nextDrawer =
      participants[(nextRoundNumber - 1) % participants.length];
    const availableWords = await transaction.word.findMany({
      where: {
        isActive: true,
        rounds: {
          none: { gameSessionId: gameSession.id },
        },
      },
      select: {
        id: true,
        answer: true,
        difficulty: true,
      },
    });

    if (availableWords.length === 0) {
      throw new AppException(GAME_ERROR.WORD_POOL_EMPTY);
    }

    const nextWord =
      availableWords[Math.floor(Math.random() * availableWords.length)];
    const nextRoundStartedAt = new Date();
    const nextRoundExpiresAt = createRoundExpiresAt(nextRoundStartedAt);
    const nextRound = await transaction.gameRound.create({
      data: {
        gameSessionId: gameSession.id,
        wordId: nextWord.id,
        drawerParticipantId: nextDrawer.id,
        roundNumber: nextRoundNumber,
        answerSnapshot: nextWord.answer,
        difficultySnapshot: nextWord.difficulty,
        startedAt: nextRoundStartedAt,
        expiresAt: nextRoundExpiresAt,
      },
      select: {
        id: true,
        startedAt: true,
        expiresAt: true,
      },
    });

    await transaction.gameSession.update({
      where: { id: gameSession.id },
      data: { currentRoundNumber: nextRoundNumber },
    });
    await transaction.word.update({
      where: { id: nextWord.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: nextRoundStartedAt,
      },
    });

    return {
      type: 'NEXT',
      nextRound: {
        gameSessionId: gameSession.id,
        roundId: nextRound.id,
        roundNumber: nextRoundNumber,
        totalRounds: gameSession.totalRounds,
        drawer: nextDrawer,
        difficulty: nextWord.difficulty,
        startedAt: nextRound.startedAt.toISOString(),
        expiresAt: nextRound.expiresAt.toISOString(),
      },
      nextDrawerParticipantId: nextDrawer.id,
      wordAssignment: {
        gameSessionId: gameSession.id,
        roundId: nextRound.id,
        answer: nextWord.answer,
      },
    };
  }

  private normalizeAnswer(value: string): string {
    return value
      .normalize('NFKC')
      .replace(/\s+/g, '')
      .toLocaleLowerCase('ko-KR');
  }
}
