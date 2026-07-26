import { Injectable } from '@nestjs/common';
import { AUTH_ERROR } from '@/auth/constants/auth-error.constants';
import type { RequestActor } from '@/auth/types/request-actor.type';
import { AppException } from '@/common/exceptions/app.exception';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ROOM_CODE_GENERATION_MAX_ATTEMPTS } from '@/rooms/constants/room.constants';
import { ROOM_ERROR } from '@/rooms/constants/room-error.constants';
import { CreateRoomDto } from '@/rooms/dto/create-room.dto';
import { RoomResponseDto } from '@/rooms/dto/room-response.dto';
import { createRoomCode } from '@/rooms/utils/room-code.util';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    actor: RequestActor,
    dto: CreateRoomDto,
  ): Promise<RoomResponseDto> {
    await this.ensureNotInRoom(actor);
    const nickname = await this.resolveNickname(actor, dto.nickname);

    for (
      let attempt = 0;
      attempt < ROOM_CODE_GENERATION_MAX_ATTEMPTS;
      attempt += 1
    ) {
      const code = createRoomCode();

      try {
        return await this.createRoomTransaction(actor, dto, nickname, code);
      } catch (error) {
        if (!this.isUniqueConstraintError(error)) {
          throw error;
        }

        const duplicatedRoomCode = await this.prisma.room.findUnique({
          where: { code },
          select: { id: true },
        });

        if (!duplicatedRoomCode) {
          throw new AppException(ROOM_ERROR.ALREADY_IN_ROOM);
        }
      }
    }

    throw new AppException(ROOM_ERROR.CODE_GENERATION_FAILED);
  }

  private async createRoomTransaction(
    actor: RequestActor,
    dto: CreateRoomDto,
    nickname: string,
    code: string,
  ): Promise<RoomResponseDto> {
    return this.prisma.$transaction(async (transaction) => {
      const room = await transaction.room.create({
        data: {
          code,
          title: dto.title,
          visibility: dto.visibility,
          maxPlayers: dto.maxPlayers,
          allowMidJoin: dto.allowMidJoin,
        },
      });
      const participant = await transaction.roomParticipant.create({
        data: {
          roomId: room.id,
          nickname,
          ...(actor.type === 'USER'
            ? { userId: actor.userId }
            : { guestSessionId: actor.guestSessionId }),
        },
      });
      const createdRoom = await transaction.room.update({
        where: { id: room.id },
        data: { hostParticipantId: participant.id },
      });

      return new RoomResponseDto(createdRoom, participant, 1);
    });
  }

  private async ensureNotInRoom(actor: RequestActor): Promise<void> {
    const participant = await this.prisma.roomParticipant.findFirst({
      where:
        actor.type === 'USER'
          ? { userId: actor.userId }
          : { guestSessionId: actor.guestSessionId },
      select: { id: true },
    });

    if (participant) {
      throw new AppException(ROOM_ERROR.ALREADY_IN_ROOM);
    }
  }

  private async resolveNickname(
    actor: RequestActor,
    guestNickname: string | undefined,
  ): Promise<string> {
    if (actor.type === 'GUEST') {
      if (!guestNickname) {
        throw new AppException(ROOM_ERROR.GUEST_NICKNAME_REQUIRED);
      }

      return guestNickname;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { nickname: true },
    });

    if (!user) {
      throw new AppException(AUTH_ERROR.INVALID_ACCESS_TOKEN);
    }

    return user.nickname;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
