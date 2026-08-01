import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AUTH_ERROR } from '@/auth/constants/auth-error.constants';
import type { RequestActor } from '@/auth/types/request-actor.type';
import { AppException } from '@/common/exceptions/app.exception';
import { GAME_DOMAIN_EVENT } from '@/games/events/game.events';
import { GamesService } from '@/games/games.service';
import { Prisma, RoomStatus } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { ROOM_CODE_GENERATION_MAX_ATTEMPTS } from '@/rooms/constants/room.constants';
import { ROOM_ERROR } from '@/rooms/constants/room-error.constants';
import { CreateRoomDto } from '@/rooms/dto/create-room.dto';
import { GetRoomsQueryDto } from '@/rooms/dto/get-rooms-query.dto';
import { JoinRoomDto } from '@/rooms/dto/join-room.dto';
import { JoinRoomResponseDto } from '@/rooms/dto/join-room-response.dto';
import {
  RoomDetailResponseDto,
  RoomParticipantResponseDto,
} from '@/rooms/dto/room-detail-response.dto';
import { RoomResponseDto } from '@/rooms/dto/room-response.dto';
import { UpdateReadyDto } from '@/rooms/dto/update-ready.dto';
import { ROOM_DOMAIN_EVENT } from '@/rooms/events/room.events';
import { createRoomCode } from '@/rooms/utils/room-code.util';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly gamesService: GamesService,
  ) {}

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

  async findAll(dto: GetRoomsQueryDto): Promise<{
    rooms: RoomResponseDto[];
    meta: {
      total: number;
      page: number;
      pageSize: number;
      hasNext: boolean;
    };
  }> {
    const where: Prisma.RoomWhereInput = {
      visibility: 'PUBLIC',
      status: dto.status,
      hostParticipantId: { not: null },
    };
    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip: (dto.page - 1) * dto.pageSize,
        take: dto.pageSize,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          hostParticipant: {
            select: {
              id: true,
              nickname: true,
            },
          },
          _count: {
            select: {
              participants: true,
            },
          },
        },
      }),
      this.prisma.room.count({ where }),
    ]);

    return {
      rooms: rooms
        .filter((room) => room.hostParticipant !== null)
        .map(
          (room) =>
            new RoomResponseDto(
              room,
              room.hostParticipant!,
              room._count.participants,
            ),
        ),
      meta: {
        total,
        page: dto.page,
        pageSize: dto.pageSize,
        hasNext: dto.page * dto.pageSize < total,
      },
    };
  }

  async findByCode(code: string): Promise<RoomDetailResponseDto> {
    const room = await this.prisma.room.findUnique({
      where: { code },
      include: {
        hostParticipant: {
          select: {
            id: true,
            nickname: true,
          },
        },
        participants: {
          orderBy: { joinedAt: 'asc' },
          select: {
            id: true,
            nickname: true,
            score: true,
            isReady: true,
          },
        },
      },
    });

    if (!room || !room.hostParticipant) {
      throw new AppException(ROOM_ERROR.NOT_FOUND);
    }

    return new RoomDetailResponseDto({
      ...room,
      hostParticipant: room.hostParticipant,
    });
  }

  async join(
    actor: RequestActor,
    code: string,
    dto: JoinRoomDto,
  ): Promise<JoinRoomResponseDto> {
    await this.ensureNotInRoom(actor);
    const nickname = await this.resolveNickname(actor, dto.nickname);

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const room = await transaction.room.findUnique({
          where: { code },
          include: {
            participants: {
              orderBy: { joinedAt: 'asc' },
              select: {
                id: true,
                nickname: true,
                score: true,
                isReady: true,
              },
            },
            hostParticipant: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        });

        if (!room || !room.hostParticipant) {
          throw new AppException(ROOM_ERROR.NOT_FOUND);
        }

        this.validateJoinableRoom(room, nickname);

        const participant = await transaction.roomParticipant.create({
          data: {
            roomId: room.id,
            nickname,
            ...(actor.type === 'USER'
              ? { userId: actor.userId }
              : { guestSessionId: actor.guestSessionId }),
          },
          select: {
            id: true,
            nickname: true,
            score: true,
            isReady: true,
          },
        });
        const detail = new RoomDetailResponseDto({
          ...room,
          participants: [...room.participants, participant],
          hostParticipant: room.hostParticipant,
        });

        return new JoinRoomResponseDto(detail, participant.id);
      });

      this.eventEmitter.emit(ROOM_DOMAIN_EVENT.PARTICIPANT_JOINED, {
        roomCode: code,
        participant: result.participant,
        playerCount: result.room.playerCount,
      });

      return result;
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new AppException(ROOM_ERROR.ALREADY_IN_ROOM);
      }

      throw error;
    }
  }

  async leave(actor: RequestActor, code: string): Promise<void> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const participant = await transaction.roomParticipant.findFirst({
        where: {
          room: { code },
          ...(actor.type === 'USER'
            ? { userId: actor.userId }
            : { guestSessionId: actor.guestSessionId }),
        },
        select: {
          id: true,
          roomId: true,
          room: {
            select: {
              id: true,
              code: true,
              status: true,
              hostParticipantId: true,
              participants: {
                orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
                select: {
                  id: true,
                  nickname: true,
                  score: true,
                },
              },
              _count: {
                select: { participants: true },
              },
            },
          },
        },
      });

      if (!participant) {
        throw new AppException(ROOM_ERROR.PARTICIPANT_NOT_FOUND);
      }

      const game =
        participant.room.status === RoomStatus.PLAYING
          ? await this.gamesService.handleParticipantLeave(
              transaction,
              { id: participant.room.id, code: participant.room.code },
              participant.id,
              participant.room.participants.filter(
                (item) => item.id !== participant.id,
              ),
            )
          : null;

      if (participant.room.hostParticipantId !== participant.id) {
        await transaction.roomParticipant.delete({
          where: { id: participant.id },
        });

        return {
          participantId: participant.id,
          playerCount: participant.room._count.participants - 1,
          roomDeleted: false,
          nextHost: null,
          game,
        };
      }

      const nextHost = await transaction.roomParticipant.findFirst({
        where: {
          roomId: participant.roomId,
          id: { not: participant.id },
        },
        orderBy: [{ joinedAt: 'asc' }, { id: 'asc' }],
        select: { id: true, nickname: true },
      });

      if (!nextHost) {
        await transaction.room.delete({
          where: { id: participant.roomId },
        });

        return {
          participantId: participant.id,
          playerCount: 0,
          roomDeleted: true,
          nextHost: null,
          game,
        };
      }

      await transaction.room.update({
        where: { id: participant.roomId },
        data: { hostParticipantId: nextHost.id },
      });
      await transaction.roomParticipant.delete({
        where: { id: participant.id },
      });

      return {
        participantId: participant.id,
        playerCount: participant.room._count.participants - 1,
        roomDeleted: false,
        nextHost,
        game,
      };
    });

    await this.eventEmitter.emitAsync(ROOM_DOMAIN_EVENT.PARTICIPANT_LEFT, {
      roomCode: code,
      participantId: result.participantId,
      playerCount: result.playerCount,
      roomDeleted: result.roomDeleted,
    });

    if (result.nextHost) {
      await this.eventEmitter.emitAsync(ROOM_DOMAIN_EVENT.HOST_CHANGED, {
        roomCode: code,
        host: result.nextHost,
      });
    }

    if (result.game) {
      await this.eventEmitter.emitAsync(
        GAME_DOMAIN_EVENT.PARTICIPANT_LEFT,
        result.game,
      );
    }
  }

  async updateReady(
    actor: RequestActor,
    code: string,
    dto: UpdateReadyDto,
  ): Promise<RoomParticipantResponseDto> {
    const participant = await this.prisma.roomParticipant.findFirst({
      where: {
        room: { code },
        ...(actor.type === 'USER'
          ? { userId: actor.userId }
          : { guestSessionId: actor.guestSessionId }),
      },
      select: {
        id: true,
        nickname: true,
        score: true,
        isReady: true,
        room: {
          select: {
            status: true,
            hostParticipantId: true,
          },
        },
      },
    });

    if (!participant) {
      throw new AppException(ROOM_ERROR.PARTICIPANT_NOT_FOUND);
    }

    if (participant.id === participant.room.hostParticipantId) {
      throw new AppException(ROOM_ERROR.HOST_READY_NOT_ALLOWED);
    }

    if (participant.room.status !== RoomStatus.WAITING) {
      throw new AppException(ROOM_ERROR.READY_NOT_CHANGEABLE);
    }

    const updatedParticipant = await this.prisma.roomParticipant.update({
      where: { id: participant.id },
      data: { isReady: dto.isReady },
      select: {
        id: true,
        nickname: true,
        score: true,
        isReady: true,
      },
    });

    const response = new RoomParticipantResponseDto(
      updatedParticipant,
      participant.room.hostParticipantId,
    );

    this.eventEmitter.emit(ROOM_DOMAIN_EVENT.READY_CHANGED, {
      roomCode: code,
      participant: response,
    });

    return response;
  }

  async start(
    actor: RequestActor,
    code: string,
  ): Promise<RoomDetailResponseDto> {
    const result = await this.prisma.$transaction(async (transaction) => {
      const participant = await transaction.roomParticipant.findFirst({
        where: {
          room: { code },
          ...(actor.type === 'USER'
            ? { userId: actor.userId }
            : { guestSessionId: actor.guestSessionId }),
        },
        select: {
          id: true,
          room: {
            select: {
              id: true,
              code: true,
              title: true,
              status: true,
              visibility: true,
              maxPlayers: true,
              allowMidJoin: true,
              hostParticipantId: true,
              createdAt: true,
              hostParticipant: {
                select: {
                  id: true,
                  nickname: true,
                },
              },
              participants: {
                orderBy: { joinedAt: 'asc' },
                select: {
                  id: true,
                  nickname: true,
                  score: true,
                  isReady: true,
                },
              },
            },
          },
        },
      });

      if (!participant) {
        throw new AppException(ROOM_ERROR.PARTICIPANT_NOT_FOUND);
      }

      const { room } = participant;
      const { hostParticipant } = room;

      if (!hostParticipant) {
        throw new AppException(ROOM_ERROR.NOT_FOUND);
      }

      if (participant.id !== room.hostParticipantId) {
        throw new AppException(ROOM_ERROR.ONLY_HOST_CAN_START);
      }

      if (room.status !== RoomStatus.WAITING) {
        throw new AppException(ROOM_ERROR.START_NOT_ALLOWED);
      }

      if (room.participants.length < 2) {
        throw new AppException(ROOM_ERROR.NOT_ENOUGH_PARTICIPANTS);
      }

      const hasUnreadyParticipant = room.participants.some(
        (item) => item.id !== room.hostParticipantId && !item.isReady,
      );

      if (hasUnreadyParticipant) {
        throw new AppException(ROOM_ERROR.PARTICIPANTS_NOT_READY);
      }

      const updated = await transaction.room.updateMany({
        where: {
          id: room.id,
          status: RoomStatus.WAITING,
        },
        data: {
          status: RoomStatus.PLAYING,
          startedAt: new Date(),
        },
      });

      if (updated.count !== 1) {
        throw new AppException(ROOM_ERROR.START_NOT_ALLOWED);
      }

      const game = await this.gamesService.start(transaction, room);

      return {
        room: new RoomDetailResponseDto({
          ...room,
          status: RoomStatus.PLAYING,
          hostParticipant,
        }),
        game,
      };
    });

    this.eventEmitter.emit(ROOM_DOMAIN_EVENT.GAME_STARTED, {
      roomCode: code,
      room: result.room,
      ...result.game,
    });

    return result.room;
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

  private validateJoinableRoom(
    room: {
      status: string;
      allowMidJoin: boolean;
      maxPlayers: number;
      participants: Array<{ nickname: string }>;
    },
    nickname: string,
  ): void {
    if (room.status === 'FINISHED' || room.status === 'CLOSED') {
      throw new AppException(ROOM_ERROR.NOT_JOINABLE);
    }

    if (room.status === 'PLAYING' && !room.allowMidJoin) {
      throw new AppException(ROOM_ERROR.MID_JOIN_NOT_ALLOWED);
    }

    if (room.participants.length >= room.maxPlayers) {
      throw new AppException(ROOM_ERROR.FULL);
    }

    if (
      room.participants.some(
        (participant) =>
          participant.nickname.toLocaleLowerCase() ===
          nickname.toLocaleLowerCase(),
      )
    ) {
      throw new AppException(ROOM_ERROR.NICKNAME_DUPLICATED);
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
