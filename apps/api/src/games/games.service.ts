import { Injectable } from '@nestjs/common';
import { AppException } from '@/common/exceptions/app.exception';
import { Prisma } from '@/generated/prisma/client';
import { GAME_ERROR } from '@/games/constants/game-error.constants';
import type {
  StartGameResult,
  StartGameRoom,
} from '@/games/types/game-start.type';

@Injectable()
export class GamesService {
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
      },
      select: {
        id: true,
        startedAt: true,
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
      },
      drawerParticipantId: drawer.id,
      wordAssignment: {
        gameSessionId: gameSession.id,
        roundId: round.id,
        answer: word.answer,
      },
    };
  }
}
