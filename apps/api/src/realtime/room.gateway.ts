import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { RealtimeErrorResponse } from '@sketch-talk/contracts';
import type { Namespace } from 'socket.io';
import { AppException } from '@/common/exceptions/app.exception';
import { PrismaService } from '@/prisma/prisma.service';
import {
  getRoomSocketChannel,
  ROOM_SOCKET_EVENT,
  ROOM_SOCKET_NAMESPACE,
  ROOM_SOCKET_PATH,
} from '@/realtime/constants/realtime.constants';
import { REALTIME_ERROR } from '@/realtime/constants/realtime-error.constants';
import { SocketAuthService } from '@/realtime/socket-auth.service';
import type { AuthenticatedSocket } from '@/realtime/types/authenticated-socket.type';
import {
  ROOM_DOMAIN_EVENT,
  type RoomGameStartedDomainEvent,
  type RoomHostChangedDomainEvent,
  type RoomParticipantJoinedDomainEvent,
  type RoomParticipantLeftDomainEvent,
  type RoomReadyChangedDomainEvent,
} from '@/rooms/events/room.events';
import { RoomsService } from '@/rooms/rooms.service';

@WebSocketGateway({
  namespace: ROOM_SOCKET_NAMESPACE,
  path: ROOM_SOCKET_PATH,
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class RoomGateway implements OnGatewayInit<Namespace> {
  @WebSocketServer()
  private server!: Namespace;

  constructor(
    private readonly socketAuthService: SocketAuthService,
    private readonly prisma: PrismaService,
    private readonly roomsService: RoomsService,
  ) {}

  afterInit(server: Namespace): void {
    server.use((socket: AuthenticatedSocket, next) => {
      void this.authenticateConnection(socket, next);
    });
  }

  @SubscribeMessage(ROOM_SOCKET_EVENT.SUBSCRIBE)
  async subscribeRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const code = this.parseRoomCode(payload);

    if (!code) {
      this.emitError(client, REALTIME_ERROR.INVALID_SUBSCRIBE_PAYLOAD);
      return;
    }

    const actor = client.data.actor;

    if (!actor) {
      client.disconnect(true);
      return;
    }

    const participant = await this.prisma.roomParticipant.findFirst({
      where: {
        room: { code },
        ...(actor.type === 'USER'
          ? { userId: actor.userId }
          : { guestSessionId: actor.guestSessionId }),
      },
      select: { id: true },
    });

    if (!participant) {
      this.emitError(client, {
        code: 'ROOM_PARTICIPANT_NOT_FOUND',
        message: '해당 방에 참가하고 있지 않습니다.',
      });
      return;
    }

    const room = await this.roomsService.findByCode(code);
    const previousRoomCode = client.data.roomCode;

    if (previousRoomCode && previousRoomCode !== code) {
      await client.leave(getRoomSocketChannel(previousRoomCode));
    }

    await client.join(getRoomSocketChannel(code));
    client.data.roomCode = code;
    client.data.participantId = participant.id;
    client.emit(ROOM_SOCKET_EVENT.STATE, room);
  }

  @OnEvent(ROOM_DOMAIN_EVENT.PARTICIPANT_JOINED)
  handleParticipantJoined(event: RoomParticipantJoinedDomainEvent): void {
    this.emitToRoom(
      event.roomCode,
      ROOM_SOCKET_EVENT.PARTICIPANT_JOINED,
      event,
    );
  }

  @OnEvent(ROOM_DOMAIN_EVENT.PARTICIPANT_LEFT)
  async handleParticipantLeft(
    event: RoomParticipantLeftDomainEvent,
  ): Promise<void> {
    const channel = getRoomSocketChannel(event.roomCode);

    if (event.roomDeleted) {
      this.server.to(channel).emit(ROOM_SOCKET_EVENT.PARTICIPANT_LEFT, event);
      this.server.in(channel).socketsLeave(channel);
      return;
    }

    const sockets = await this.server.in(channel).fetchSockets();
    const leavingSockets = sockets.filter(
      (socket) => socket.data.participantId === event.participantId,
    );

    await Promise.all(leavingSockets.map((socket) => socket.leave(channel)));
    this.server.to(channel).emit(ROOM_SOCKET_EVENT.PARTICIPANT_LEFT, event);
  }

  @OnEvent(ROOM_DOMAIN_EVENT.HOST_CHANGED)
  handleHostChanged(event: RoomHostChangedDomainEvent): void {
    this.emitToRoom(event.roomCode, ROOM_SOCKET_EVENT.HOST_CHANGED, event);
  }

  @OnEvent(ROOM_DOMAIN_EVENT.READY_CHANGED)
  handleReadyChanged(event: RoomReadyChangedDomainEvent): void {
    this.emitToRoom(event.roomCode, ROOM_SOCKET_EVENT.READY_CHANGED, event);
  }

  @OnEvent(ROOM_DOMAIN_EVENT.GAME_STARTED)
  async handleGameStarted(event: RoomGameStartedDomainEvent): Promise<void> {
    const { drawerParticipantId, wordAssignment, ...publicEvent } = event;
    const channel = getRoomSocketChannel(event.roomCode);

    this.emitToRoom(
      event.roomCode,
      ROOM_SOCKET_EVENT.GAME_STARTED,
      publicEvent,
    );

    const sockets = await this.server.in(channel).fetchSockets();
    const drawerSockets = sockets.filter(
      (socket) => socket.data.participantId === drawerParticipantId,
    );

    for (const socket of drawerSockets) {
      socket.emit(ROOM_SOCKET_EVENT.WORD_ASSIGNED, wordAssignment);
    }
  }

  private async authenticateConnection(
    socket: AuthenticatedSocket,
    next: (error?: Error) => void,
  ): Promise<void> {
    try {
      socket.data.actor = await this.socketAuthService.authenticate(socket);
      next();
    } catch (error) {
      const response = this.resolveConnectionError(error);
      const socketError = new Error(response.message) as Error & {
        data?: RealtimeErrorResponse;
      };

      socketError.data = response;
      next(socketError);
    }
  }

  private resolveConnectionError(error: unknown): RealtimeErrorResponse {
    if (error instanceof AppException) {
      const response = error.getResponse();

      if (this.isRecord(response)) {
        const code = response.code;
        const message = response.message;

        if (typeof code === 'string' && typeof message === 'string') {
          return { code, message };
        }
      }
    }

    return {
      code: 'REALTIME_CONNECTION_FAILED',
      message: '실시간 서버 연결에 실패했습니다.',
    };
  }

  private parseRoomCode(payload: unknown): string | undefined {
    if (!this.isRecord(payload) || typeof payload.code !== 'string') {
      return undefined;
    }

    const code = payload.code.trim().toUpperCase();

    return /^[A-HJ-NP-Z2-9]{6}$/.test(code) ? code : undefined;
  }

  private emitError(
    client: AuthenticatedSocket,
    error: RealtimeErrorResponse,
  ): void {
    client.emit(ROOM_SOCKET_EVENT.ERROR, error);
  }

  private emitToRoom<T>(roomCode: string, event: string, data: T): void {
    this.server.to(getRoomSocketChannel(roomCode)).emit(event, data);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
