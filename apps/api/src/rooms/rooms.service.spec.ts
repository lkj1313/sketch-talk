import { HttpStatus } from '@nestjs/common';
import { RoomStatus, RoomVisibility } from '@/generated/prisma/client';
import { AppException } from '@/common/exceptions/app.exception';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoomDto } from '@/rooms/dto/create-room.dto';
import { RoomsService } from '@/rooms/rooms.service';

describe('RoomsService', () => {
  const roomParticipantFindFirst = jest.fn();
  const roomParticipantCreate = jest.fn();
  const roomCreate = jest.fn();
  const roomUpdate = jest.fn();
  const roomFindUnique = jest.fn();
  const userFindUnique = jest.fn();
  const transaction = jest.fn();
  const prisma = {
    roomParticipant: {
      findFirst: roomParticipantFindFirst,
      create: roomParticipantCreate,
    },
    room: {
      create: roomCreate,
      update: roomUpdate,
      findUnique: roomFindUnique,
    },
    user: {
      findUnique: userFindUnique,
    },
    $transaction: transaction,
  } as unknown as PrismaService;
  const roomsService = new RoomsService(prisma);
  const createdAt = new Date();
  const dto: CreateRoomDto = {
    title: '같이 게임해요',
    visibility: RoomVisibility.PUBLIC,
    maxPlayers: 8,
    allowMidJoin: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    roomParticipantFindFirst.mockResolvedValue(null);
    roomFindUnique.mockResolvedValue(null);
    roomCreate.mockResolvedValue({
      id: 'room-id',
      code: 'ABC234',
      title: dto.title,
      status: RoomStatus.WAITING,
      visibility: dto.visibility,
      maxPlayers: dto.maxPlayers,
      allowMidJoin: dto.allowMidJoin,
      createdAt,
    });
    roomParticipantCreate.mockResolvedValue({
      id: 'participant-id',
      nickname: '그림왕',
    });
    roomUpdate.mockResolvedValue({
      id: 'room-id',
      code: 'ABC234',
      title: dto.title,
      status: RoomStatus.WAITING,
      visibility: dto.visibility,
      maxPlayers: dto.maxPlayers,
      allowMidJoin: dto.allowMidJoin,
      createdAt,
    });
    transaction.mockImplementation(
      async (callback: (transaction: PrismaService) => Promise<unknown>) =>
        callback(prisma),
    );
  });

  it('회원의 계정 닉네임으로 방과 방장 참가자를 생성한다', async () => {
    userFindUnique.mockResolvedValue({ nickname: '그림왕' });

    await expect(
      roomsService.create({ type: 'USER', userId: 'user-id' }, dto),
    ).resolves.toEqual({
      id: 'room-id',
      code: 'ABC234',
      title: dto.title,
      status: RoomStatus.WAITING,
      visibility: RoomVisibility.PUBLIC,
      maxPlayers: 8,
      allowMidJoin: true,
      playerCount: 1,
      host: {
        id: 'participant-id',
        nickname: '그림왕',
      },
      createdAt: createdAt.toISOString(),
    });
    expect(roomParticipantCreate).toHaveBeenCalledWith({
      data: {
        roomId: 'room-id',
        nickname: '그림왕',
        userId: 'user-id',
      },
    });
    expect(roomUpdate).toHaveBeenCalledWith({
      where: { id: 'room-id' },
      data: { hostParticipantId: 'participant-id' },
    });
  });

  it('비회원의 요청 닉네임으로 방과 방장 참가자를 생성한다', async () => {
    roomParticipantCreate.mockResolvedValue({
      id: 'guest-participant-id',
      nickname: '게스트123',
    });

    await roomsService.create(
      { type: 'GUEST', guestSessionId: 'guest-session-id' },
      { ...dto, nickname: '게스트123' },
    );

    expect(userFindUnique).not.toHaveBeenCalled();
    expect(roomParticipantCreate).toHaveBeenCalledWith({
      data: {
        roomId: 'room-id',
        nickname: '게스트123',
        guestSessionId: 'guest-session-id',
      },
    });
  });

  it('이미 방에 참가 중이면 ROOM_ALREADY_IN_ROOM 오류를 발생시킨다', async () => {
    roomParticipantFindFirst.mockResolvedValue({ id: 'participant-id' });

    const error = await getCreateRoomError(
      roomsService,
      { type: 'USER', userId: 'user-id' },
      dto,
    );

    expect(error.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(error.getResponse()).toEqual({
      code: 'ROOM_ALREADY_IN_ROOM',
      message: '이미 다른 방에 참가 중입니다.',
    });
  });

  it('비회원 닉네임이 없으면 ROOM_GUEST_NICKNAME_REQUIRED 오류를 발생시킨다', async () => {
    const error = await getCreateRoomError(
      roomsService,
      { type: 'GUEST', guestSessionId: 'guest-session-id' },
      dto,
    );

    expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(error.getResponse()).toEqual({
      code: 'ROOM_GUEST_NICKNAME_REQUIRED',
      message: '비회원은 닉네임이 필요합니다.',
    });
  });
});

async function getCreateRoomError(
  roomsService: RoomsService,
  actor:
    | { type: 'USER'; userId: string }
    | { type: 'GUEST'; guestSessionId: string },
  dto: CreateRoomDto,
): Promise<AppException> {
  try {
    await roomsService.create(actor, dto);
  } catch (error) {
    if (error instanceof AppException) {
      return error;
    }
  }

  throw new Error('AppException이 발생하지 않았습니다.');
}
