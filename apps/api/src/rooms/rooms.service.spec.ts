import { HttpStatus } from '@nestjs/common';
import { RoomStatus, RoomVisibility } from '@/generated/prisma/client';
import { AppException } from '@/common/exceptions/app.exception';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateRoomDto } from '@/rooms/dto/create-room.dto';
import { RoomsService } from '@/rooms/rooms.service';

describe('RoomsService', () => {
  const roomParticipantFindFirst = jest.fn();
  const roomParticipantCreate = jest.fn();
  const roomParticipantDelete = jest.fn();
  const roomCreate = jest.fn();
  const roomDelete = jest.fn();
  const roomUpdate = jest.fn();
  const roomFindUnique = jest.fn();
  const roomFindMany = jest.fn();
  const roomCount = jest.fn();
  const userFindUnique = jest.fn();
  const transaction = jest.fn();
  const prisma = {
    roomParticipant: {
      findFirst: roomParticipantFindFirst,
      create: roomParticipantCreate,
      delete: roomParticipantDelete,
    },
    room: {
      create: roomCreate,
      delete: roomDelete,
      update: roomUpdate,
      findUnique: roomFindUnique,
      findMany: roomFindMany,
      count: roomCount,
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
  const joinableRoom = {
    id: 'room-id',
    code: 'ABC234',
    title: dto.title,
    status: RoomStatus.WAITING,
    visibility: RoomVisibility.PUBLIC,
    maxPlayers: 8,
    allowMidJoin: true,
    hostParticipantId: 'host-participant-id',
    createdAt,
    hostParticipant: {
      id: 'host-participant-id',
      nickname: '방장',
    },
    participants: [
      {
        id: 'host-participant-id',
        nickname: '방장',
        score: 0,
        isReady: false,
      },
    ],
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

  it('공개 방 목록과 페이지 메타데이터를 반환한다', async () => {
    roomFindMany.mockResolvedValue([
      {
        id: 'room-id',
        code: 'ABC234',
        title: dto.title,
        status: RoomStatus.WAITING,
        visibility: RoomVisibility.PUBLIC,
        maxPlayers: 8,
        allowMidJoin: true,
        createdAt,
        hostParticipant: {
          id: 'participant-id',
          nickname: '그림왕',
        },
        _count: {
          participants: 3,
        },
      },
    ]);
    roomCount.mockResolvedValue(2);

    await expect(
      roomsService.findAll({
        page: 1,
        pageSize: 1,
        status: RoomStatus.WAITING,
      }),
    ).resolves.toEqual({
      rooms: [
        {
          id: 'room-id',
          code: 'ABC234',
          title: dto.title,
          status: RoomStatus.WAITING,
          visibility: RoomVisibility.PUBLIC,
          maxPlayers: 8,
          allowMidJoin: true,
          playerCount: 3,
          host: {
            id: 'participant-id',
            nickname: '그림왕',
          },
          createdAt: createdAt.toISOString(),
        },
      ],
      meta: {
        total: 2,
        page: 1,
        pageSize: 1,
        hasNext: true,
      },
    });
    expect(roomFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          visibility: 'PUBLIC',
          status: RoomStatus.WAITING,
          hostParticipantId: { not: null },
        },
        skip: 0,
        take: 1,
      }),
    );
  });

  it('방 코드로 참가자 목록을 포함한 상세 정보를 반환한다', async () => {
    roomFindUnique.mockResolvedValue({
      id: 'room-id',
      code: 'ABC234',
      title: dto.title,
      status: RoomStatus.WAITING,
      visibility: RoomVisibility.PRIVATE,
      maxPlayers: 8,
      allowMidJoin: true,
      hostParticipantId: 'participant-id',
      createdAt,
      hostParticipant: {
        id: 'participant-id',
        nickname: '그림왕',
      },
      participants: [
        {
          id: 'participant-id',
          nickname: '그림왕',
          score: 0,
          isReady: false,
        },
      ],
    });

    const result = await roomsService.findByCode('ABC234');

    expect(result.participants).toEqual([
      {
        id: 'participant-id',
        nickname: '그림왕',
        score: 0,
        isReady: false,
        isHost: true,
      },
    ]);
    expect(result.visibility).toBe(RoomVisibility.PRIVATE);
  });

  it('방 코드가 존재하지 않으면 ROOM_NOT_FOUND 오류를 발생시킨다', async () => {
    roomFindUnique.mockResolvedValue(null);

    const error = await getFindRoomError(roomsService, 'ZZZZZZ');

    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toEqual({
      code: 'ROOM_NOT_FOUND',
      message: '방을 찾을 수 없습니다.',
    });
  });

  it('회원의 계정 닉네임으로 방에 참가한다', async () => {
    userFindUnique.mockResolvedValue({ nickname: '회원닉네임' });
    roomFindUnique.mockResolvedValue(joinableRoom);
    roomParticipantCreate.mockResolvedValue({
      id: 'joined-participant-id',
      nickname: '회원닉네임',
      score: 0,
      isReady: false,
    });

    const result = await roomsService.join(
      { type: 'USER', userId: 'user-id' },
      'ABC234',
      {},
    );

    expect(roomParticipantCreate).toHaveBeenCalledWith({
      data: {
        roomId: 'room-id',
        nickname: '회원닉네임',
        userId: 'user-id',
      },
      select: {
        id: true,
        nickname: true,
        score: true,
        isReady: true,
      },
    });
    expect(result.participant).toEqual({
      id: 'joined-participant-id',
      nickname: '회원닉네임',
      score: 0,
      isReady: false,
      isHost: false,
    });
    expect(result.room.playerCount).toBe(2);
  });

  it('비회원 닉네임이 없으면 방 참가를 거절한다', async () => {
    const error = await getJoinRoomError(
      roomsService,
      { type: 'GUEST', guestSessionId: 'guest-session-id' },
      'ABC234',
      {},
    );

    expect(error.getResponse()).toEqual({
      code: 'ROOM_GUEST_NICKNAME_REQUIRED',
      message: '비회원은 닉네임이 필요합니다.',
    });
  });

  it('정원이 가득 찬 방은 참가를 거절한다', async () => {
    roomFindUnique.mockResolvedValue({
      ...joinableRoom,
      maxPlayers: 1,
    });

    const error = await getJoinRoomError(
      roomsService,
      { type: 'GUEST', guestSessionId: 'guest-session-id' },
      'ABC234',
      { nickname: '게스트' },
    );

    expect(error.getResponse()).toEqual({
      code: 'ROOM_FULL',
      message: '방의 정원이 가득 찼습니다.',
    });
  });

  it('중간 참가를 허용하지 않은 진행 중인 방은 참가를 거절한다', async () => {
    roomFindUnique.mockResolvedValue({
      ...joinableRoom,
      status: RoomStatus.PLAYING,
      allowMidJoin: false,
    });

    const error = await getJoinRoomError(
      roomsService,
      { type: 'GUEST', guestSessionId: 'guest-session-id' },
      'ABC234',
      { nickname: '게스트' },
    );

    expect(error.getResponse()).toEqual({
      code: 'ROOM_MID_JOIN_NOT_ALLOWED',
      message: '게임이 시작된 후에는 참가할 수 없는 방입니다.',
    });
  });

  it('종료되거나 닫힌 방은 참가를 거절한다', async () => {
    roomFindUnique.mockResolvedValue({
      ...joinableRoom,
      status: RoomStatus.CLOSED,
    });

    const error = await getJoinRoomError(
      roomsService,
      { type: 'GUEST', guestSessionId: 'guest-session-id' },
      'ABC234',
      { nickname: '게스트' },
    );

    expect(error.getResponse()).toEqual({
      code: 'ROOM_NOT_JOINABLE',
      message: '참가할 수 없는 상태의 방입니다.',
    });
  });

  it('방에서 사용 중인 닉네임은 대소문자와 관계없이 거절한다', async () => {
    roomFindUnique.mockResolvedValue(joinableRoom);

    const error = await getJoinRoomError(
      roomsService,
      { type: 'GUEST', guestSessionId: 'guest-session-id' },
      'ABC234',
      { nickname: '방장' },
    );

    expect(error.getResponse()).toEqual({
      code: 'ROOM_NICKNAME_DUPLICATED',
      message: '방에서 이미 사용 중인 닉네임입니다.',
    });
  });

  it('일반 참가자가 방을 나가면 참가자 정보만 삭제한다', async () => {
    roomParticipantFindFirst.mockResolvedValue({
      id: 'participant-id',
      roomId: 'room-id',
      room: { hostParticipantId: 'host-participant-id' },
    });

    await roomsService.leave({ type: 'USER', userId: 'user-id' }, 'ABC234');

    expect(roomParticipantDelete).toHaveBeenCalledWith({
      where: { id: 'participant-id' },
    });
    expect(roomUpdate).not.toHaveBeenCalled();
    expect(roomDelete).not.toHaveBeenCalled();
  });

  it('방장이 나가면 가장 먼저 들어온 참가자에게 방장을 넘긴다', async () => {
    roomParticipantFindFirst
      .mockResolvedValueOnce({
        id: 'host-participant-id',
        roomId: 'room-id',
        room: { hostParticipantId: 'host-participant-id' },
      })
      .mockResolvedValueOnce({ id: 'next-host-id' });

    await roomsService.leave(
      { type: 'GUEST', guestSessionId: 'guest-session-id' },
      'ABC234',
    );

    expect(roomUpdate).toHaveBeenCalledWith({
      where: { id: 'room-id' },
      data: { hostParticipantId: 'next-host-id' },
    });
    expect(roomParticipantDelete).toHaveBeenCalledWith({
      where: { id: 'host-participant-id' },
    });
  });

  it('마지막 참가자가 방을 나가면 방을 삭제한다', async () => {
    roomParticipantFindFirst
      .mockResolvedValueOnce({
        id: 'host-participant-id',
        roomId: 'room-id',
        room: { hostParticipantId: 'host-participant-id' },
      })
      .mockResolvedValueOnce(null);

    await roomsService.leave(
      { type: 'GUEST', guestSessionId: 'guest-session-id' },
      'ABC234',
    );

    expect(roomDelete).toHaveBeenCalledWith({
      where: { id: 'room-id' },
    });
    expect(roomParticipantDelete).not.toHaveBeenCalled();
  });

  it('참가하지 않은 방에서 나가기를 요청하면 오류를 반환한다', async () => {
    roomParticipantFindFirst.mockResolvedValue(null);

    const error = await getLeaveRoomError(
      roomsService,
      { type: 'USER', userId: 'user-id' },
      'ABC234',
    );

    expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(error.getResponse()).toEqual({
      code: 'ROOM_PARTICIPANT_NOT_FOUND',
      message: '해당 방에 참가하고 있지 않습니다.',
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

async function getFindRoomError(
  roomsService: RoomsService,
  code: string,
): Promise<AppException> {
  try {
    await roomsService.findByCode(code);
  } catch (error) {
    if (error instanceof AppException) {
      return error;
    }
  }

  throw new Error('AppException이 발생하지 않았습니다.');
}

async function getJoinRoomError(
  roomsService: RoomsService,
  actor:
    | { type: 'USER'; userId: string }
    | { type: 'GUEST'; guestSessionId: string },
  code: string,
  dto: { nickname?: string },
): Promise<AppException> {
  try {
    await roomsService.join(actor, code, dto);
  } catch (error) {
    if (error instanceof AppException) {
      return error;
    }
  }

  throw new Error('AppException이 발생하지 않았습니다.');
}

async function getLeaveRoomError(
  roomsService: RoomsService,
  actor:
    | { type: 'USER'; userId: string }
    | { type: 'GUEST'; guestSessionId: string },
  code: string,
): Promise<AppException> {
  try {
    await roomsService.leave(actor, code);
  } catch (error) {
    if (error instanceof AppException) {
      return error;
    }
  }

  throw new Error('AppException이 발생하지 않았습니다.');
}
