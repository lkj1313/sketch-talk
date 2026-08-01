import type { RoomGameStartedDomainEvent } from '@/rooms/events/room.events';
import type { GameRoundTimedOutDomainEvent } from '@/games/events/game.events';
import type { DrawingStroke } from '@sketch-talk/contracts';
import { RoomGateway } from '@/realtime/room.gateway';
import { ROOM_SOCKET_EVENT } from '@/realtime/constants/realtime.constants';

jest.mock('@/realtime/socket-auth.service', () => ({
  SocketAuthService: class SocketAuthService {},
}));

describe('RoomGateway', () => {
  it('현재 출제자의 그림 선을 같은 방의 다른 참가자에게 전달한다', async () => {
    const assertCanDraw = jest.fn().mockResolvedValue(undefined);
    const roomEmit = jest.fn();
    const client = {
      data: {
        roomCode: 'ABC234',
        participantId: 'drawer-id',
      },
      to: jest.fn().mockReturnValue({ emit: roomEmit }),
      emit: jest.fn(),
    };
    const gateway = new RoomGateway(
      {} as never,
      {} as never,
      {} as never,
      { assertCanDraw } as never,
    );
    const stroke: DrawingStroke = {
      roundId: '123e4567-e89b-42d3-a456-426614174000',
      strokeId: '123e4567-e89b-42d3-a456-426614174001',
      tool: 'PEN',
      color: '#000000',
      width: 5,
      points: [
        { x: 0.1, y: 0.2 },
        { x: 0.2, y: 0.3 },
      ],
    };

    await gateway.handleDrawingStroke(client as never, stroke);

    expect(assertCanDraw).toHaveBeenCalledWith(
      'ABC234',
      'drawer-id',
      stroke.roundId,
    );
    expect(client.to).toHaveBeenCalledWith('room:ABC234');
    expect(roomEmit).toHaveBeenCalledWith(
      ROOM_SOCKET_EVENT.DRAWING_STROKE_ADDED,
      stroke,
    );
    expect(client.emit).not.toHaveBeenCalled();
  });

  it('좌표 범위를 벗어난 그림 선을 거부한다', async () => {
    const assertCanDraw = jest.fn();
    const client = {
      data: {
        roomCode: 'ABC234',
        participantId: 'drawer-id',
      },
      to: jest.fn(),
      emit: jest.fn(),
    };
    const gateway = new RoomGateway(
      {} as never,
      {} as never,
      {} as never,
      { assertCanDraw } as never,
    );

    await gateway.handleDrawingStroke(client as never, {
      roundId: '123e4567-e89b-42d3-a456-426614174000',
      strokeId: '123e4567-e89b-42d3-a456-426614174001',
      tool: 'PEN',
      color: '#000000',
      width: 5,
      points: [{ x: 2, y: 0.2 }],
    });

    expect(client.emit).toHaveBeenCalledWith(ROOM_SOCKET_EVENT.ERROR, {
      code: 'REALTIME_INVALID_DRAWING_STROKE',
      message: '올바른 그림 선 데이터가 필요합니다.',
    });
    expect(assertCanDraw).not.toHaveBeenCalled();
    expect(client.to).not.toHaveBeenCalled();
  });

  it('게임 시작 정보는 방 전체에 보내고 정답은 출제자에게만 보낸다', async () => {
    const roomEmit = jest.fn();
    const drawerEmit = jest.fn();
    const participantEmit = jest.fn();
    const server = {
      to: jest.fn().mockReturnValue({ emit: roomEmit }),
      in: jest.fn().mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([
          {
            data: { participantId: 'drawer-id' },
            emit: drawerEmit,
          },
          {
            data: { participantId: 'participant-id' },
            emit: participantEmit,
          },
        ]),
      }),
    };
    const gateway = new RoomGateway(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    (gateway as unknown as { server: typeof server }).server = server;
    const event: RoomGameStartedDomainEvent = {
      roomCode: 'ABC234',
      room: {} as never,
      game: {
        gameSessionId: 'game-session-id',
        roundId: 'round-id',
        roundNumber: 1,
        totalRounds: 2,
        drawer: { id: 'drawer-id', nickname: '방장' },
        difficulty: 'EASY',
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 120_000).toISOString(),
      },
      drawerParticipantId: 'drawer-id',
      wordAssignment: {
        gameSessionId: 'game-session-id',
        roundId: 'round-id',
        answer: '고양이',
      },
    };

    await gateway.handleGameStarted(event);

    expect(roomEmit).toHaveBeenCalledWith(
      ROOM_SOCKET_EVENT.GAME_STARTED,
      expect.not.objectContaining({
        drawerParticipantId: expect.anything(),
        wordAssignment: expect.anything(),
      }),
    );
    expect(drawerEmit).toHaveBeenCalledWith(
      ROOM_SOCKET_EVENT.WORD_ASSIGNED,
      event.wordAssignment,
    );
    expect(participantEmit).not.toHaveBeenCalledWith(
      ROOM_SOCKET_EVENT.WORD_ASSIGNED,
      expect.anything(),
    );
  });

  it('라운드 제한 시간이 끝나면 정답을 공개하고 다음 출제자에게만 제시어를 보낸다', async () => {
    const roomEmit = jest.fn();
    const nextDrawerEmit = jest.fn();
    const participantEmit = jest.fn();
    const server = {
      to: jest.fn().mockReturnValue({ emit: roomEmit }),
      in: jest.fn().mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([
          {
            data: { participantId: 'next-drawer-id' },
            emit: nextDrawerEmit,
          },
          {
            data: { participantId: 'participant-id' },
            emit: participantEmit,
          },
        ]),
      }),
    };
    const gateway = new RoomGateway(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
    (gateway as unknown as { server: typeof server }).server = server;
    const event: GameRoundTimedOutDomainEvent = {
      roomCode: 'ABC234',
      type: 'NEXT',
      timedOut: {
        gameSessionId: 'game-session-id',
        roundId: 'round-id',
        answer: '고양이',
      },
      nextRound: {
        gameSessionId: 'game-session-id',
        roundId: 'next-round-id',
        roundNumber: 2,
        totalRounds: 2,
        drawer: { id: 'next-drawer-id', nickname: '다음 출제자' },
        difficulty: 'EASY',
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 120_000).toISOString(),
      },
      nextDrawerParticipantId: 'next-drawer-id',
      wordAssignment: {
        gameSessionId: 'game-session-id',
        roundId: 'next-round-id',
        answer: '강아지',
      },
    };

    await gateway.handleRoundTimedOut(event);

    expect(roomEmit).toHaveBeenCalledWith(
      ROOM_SOCKET_EVENT.ROUND_TIMED_OUT,
      event.timedOut,
    );
    expect(roomEmit).toHaveBeenCalledWith(
      ROOM_SOCKET_EVENT.ROUND_STARTED,
      event.nextRound,
    );
    expect(nextDrawerEmit).toHaveBeenCalledWith(
      ROOM_SOCKET_EVENT.WORD_ASSIGNED,
      event.wordAssignment,
    );
    expect(participantEmit).not.toHaveBeenCalledWith(
      ROOM_SOCKET_EVENT.WORD_ASSIGNED,
      expect.anything(),
    );
  });
});
