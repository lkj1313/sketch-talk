import type { RoomGameStartedDomainEvent } from '@/rooms/events/room.events';
import type { GameRoundTimedOutDomainEvent } from '@/games/events/game.events';
import { RoomGateway } from '@/realtime/room.gateway';
import { ROOM_SOCKET_EVENT } from '@/realtime/constants/realtime.constants';

jest.mock('@/realtime/socket-auth.service', () => ({
  SocketAuthService: class SocketAuthService {},
}));

describe('RoomGateway', () => {
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
