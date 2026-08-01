import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type {
  DrawingClearRequest,
  DrawingPoint,
  DrawingStroke,
  RealtimeErrorResponse,
} from '@sketch-talk/contracts';
import type { Namespace } from 'socket.io';
import { AppException } from '@/common/exceptions/app.exception';
import { GAME_MESSAGE_MAX_LENGTH } from '@/games/constants/game.constants';
import {
  GAME_DOMAIN_EVENT,
  type GameRoundTimedOutDomainEvent,
} from '@/games/events/game.events';
import { GamesService } from '@/games/games.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  DRAWING_COLOR_MAX_LENGTH,
  DRAWING_COORDINATE_MAX,
  DRAWING_COORDINATE_MIN,
  DRAWING_POINTS_MAX_LENGTH,
  DRAWING_WIDTH_MAX,
  DRAWING_WIDTH_MIN,
} from '@/realtime/constants/drawing.constants';
import {
  getRoomSocketChannel,
  ROOM_SOCKET_EVENT,
  ROOM_SOCKET_NAMESPACE,
  ROOM_SOCKET_PATH,
} from '@/realtime/constants/realtime.constants';
import { REALTIME_ERROR } from '@/realtime/constants/realtime-error.constants';
import { SocketAuthService } from '@/realtime/socket-auth.service';
import { DrawingStateService } from '@/realtime/drawing-state.service';
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
    private readonly gamesService: GamesService,
    private readonly drawingStateService: DrawingStateService,
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
    await this.emitDrawingSync(client, code);
  }

  @SubscribeMessage(ROOM_SOCKET_EVENT.MESSAGE)
  async handleGameMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const message = this.parseGameMessage(payload);

    if (!message) {
      this.emitError(client, REALTIME_ERROR.INVALID_GAME_MESSAGE);
      return;
    }

    const roomCode = client.data.roomCode;
    const participantId = client.data.participantId;

    if (!roomCode || !participantId) {
      this.emitError(client, REALTIME_ERROR.ROOM_SUBSCRIPTION_REQUIRED);
      return;
    }

    try {
      const result = await this.gamesService.submitMessage(
        roomCode,
        participantId,
        message,
      );

      if (result.type === 'CHAT') {
        this.emitToRoom(roomCode, ROOM_SOCKET_EVENT.CHAT_MESSAGE, result.chat);
        return;
      }

      this.emitToRoom(
        roomCode,
        ROOM_SOCKET_EVENT.CORRECT_ANSWER,
        result.correctAnswer,
      );
      this.drawingStateService.clearRound(result.correctAnswer.roundId);

      if (result.type === 'FINISHED') {
        this.emitToRoom(
          roomCode,
          ROOM_SOCKET_EVENT.GAME_FINISHED,
          result.finished,
        );
        return;
      }

      this.emitToRoom(
        roomCode,
        ROOM_SOCKET_EVENT.ROUND_STARTED,
        result.nextRound,
      );
      await this.emitToParticipant(
        roomCode,
        result.nextDrawerParticipantId,
        ROOM_SOCKET_EVENT.WORD_ASSIGNED,
        result.wordAssignment,
      );
    } catch (error) {
      this.emitError(client, this.resolveConnectionError(error));
    }
  }

  @SubscribeMessage(ROOM_SOCKET_EVENT.DRAWING_STROKE)
  async handleDrawingStroke(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const stroke = this.parseDrawingStroke(payload);

    if (!stroke) {
      this.emitError(client, REALTIME_ERROR.INVALID_DRAWING_STROKE);
      return;
    }

    const roomCode = client.data.roomCode;
    const participantId = client.data.participantId;

    if (!roomCode || !participantId) {
      this.emitError(client, REALTIME_ERROR.ROOM_SUBSCRIPTION_REQUIRED);
      return;
    }

    try {
      await this.gamesService.assertCanDraw(
        roomCode,
        participantId,
        stroke.roundId,
      );

      if (!this.drawingStateService.appendStroke(stroke)) {
        this.emitError(client, REALTIME_ERROR.DRAWING_HISTORY_LIMIT_EXCEEDED);
        return;
      }

      client
        .to(getRoomSocketChannel(roomCode))
        .emit(ROOM_SOCKET_EVENT.DRAWING_STROKE_ADDED, stroke);
    } catch (error) {
      this.emitError(client, this.resolveConnectionError(error));
    }
  }

  @SubscribeMessage(ROOM_SOCKET_EVENT.DRAWING_CLEAR)
  async handleDrawingClear(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: unknown,
  ): Promise<void> {
    const request = this.parseDrawingClear(payload);

    if (!request) {
      this.emitError(client, REALTIME_ERROR.INVALID_DRAWING_CLEAR);
      return;
    }

    const roomCode = client.data.roomCode;
    const participantId = client.data.participantId;

    if (!roomCode || !participantId) {
      this.emitError(client, REALTIME_ERROR.ROOM_SUBSCRIPTION_REQUIRED);
      return;
    }

    try {
      await this.gamesService.assertCanDraw(
        roomCode,
        participantId,
        request.roundId,
      );
      this.drawingStateService.clearRound(request.roundId);
      this.emitToRoom(roomCode, ROOM_SOCKET_EVENT.DRAWING_CLEARED, request);
    } catch (error) {
      this.emitError(client, this.resolveConnectionError(error));
    }
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
    this.drawingStateService.clearRound(event.game.roundId);
    this.emitToRoom(
      event.roomCode,
      ROOM_SOCKET_EVENT.GAME_STARTED,
      publicEvent,
    );

    await this.emitToParticipant(
      event.roomCode,
      drawerParticipantId,
      ROOM_SOCKET_EVENT.WORD_ASSIGNED,
      wordAssignment,
    );
  }

  @OnEvent(GAME_DOMAIN_EVENT.ROUND_TIMED_OUT)
  async handleRoundTimedOut(
    event: GameRoundTimedOutDomainEvent,
  ): Promise<void> {
    this.drawingStateService.clearRound(event.timedOut.roundId);
    this.emitToRoom(
      event.roomCode,
      ROOM_SOCKET_EVENT.ROUND_TIMED_OUT,
      event.timedOut,
    );

    if (event.type === 'FINISHED') {
      this.emitToRoom(
        event.roomCode,
        ROOM_SOCKET_EVENT.GAME_FINISHED,
        event.finished,
      );
      return;
    }

    this.emitToRoom(
      event.roomCode,
      ROOM_SOCKET_EVENT.ROUND_STARTED,
      event.nextRound,
    );
    await this.emitToParticipant(
      event.roomCode,
      event.nextDrawerParticipantId,
      ROOM_SOCKET_EVENT.WORD_ASSIGNED,
      event.wordAssignment,
    );
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

  private parseGameMessage(payload: unknown): string | undefined {
    if (!this.isRecord(payload) || typeof payload.message !== 'string') {
      return undefined;
    }

    const message = payload.message.trim();

    return message.length > 0 && message.length <= GAME_MESSAGE_MAX_LENGTH
      ? message
      : undefined;
  }

  private parseDrawingStroke(payload: unknown): DrawingStroke | undefined {
    if (
      !this.isRecord(payload) ||
      typeof payload.roundId !== 'string' ||
      typeof payload.strokeId !== 'string' ||
      (payload.tool !== 'PEN' && payload.tool !== 'ERASER') ||
      typeof payload.color !== 'string' ||
      payload.color.length > DRAWING_COLOR_MAX_LENGTH ||
      !/^#[0-9a-fA-F]{6}$/.test(payload.color) ||
      !this.isNumberInRange(
        payload.width,
        DRAWING_WIDTH_MIN,
        DRAWING_WIDTH_MAX,
      ) ||
      !Array.isArray(payload.points) ||
      payload.points.length === 0 ||
      payload.points.length > DRAWING_POINTS_MAX_LENGTH ||
      !this.isUuid(payload.roundId) ||
      !this.isUuid(payload.strokeId)
    ) {
      return undefined;
    }

    const points = payload.points.map((point) => this.parseDrawingPoint(point));

    if (points.some((point) => !point)) {
      return undefined;
    }

    return {
      roundId: payload.roundId,
      strokeId: payload.strokeId,
      tool: payload.tool,
      color: payload.color,
      width: payload.width,
      points: points as DrawingPoint[],
    };
  }

  private parseDrawingPoint(value: unknown): DrawingPoint | undefined {
    if (
      !this.isRecord(value) ||
      !this.isNumberInRange(
        value.x,
        DRAWING_COORDINATE_MIN,
        DRAWING_COORDINATE_MAX,
      ) ||
      !this.isNumberInRange(
        value.y,
        DRAWING_COORDINATE_MIN,
        DRAWING_COORDINATE_MAX,
      )
    ) {
      return undefined;
    }

    return { x: value.x, y: value.y };
  }

  private parseDrawingClear(payload: unknown): DrawingClearRequest | undefined {
    if (
      !this.isRecord(payload) ||
      typeof payload.roundId !== 'string' ||
      !this.isUuid(payload.roundId)
    ) {
      return undefined;
    }

    return { roundId: payload.roundId };
  }

  private async emitDrawingSync(
    client: AuthenticatedSocket,
    roomCode: string,
  ): Promise<void> {
    const roundId = await this.gamesService.findActiveDrawingRoundId(roomCode);

    if (!roundId) {
      return;
    }

    client.emit(
      ROOM_SOCKET_EVENT.DRAWING_SYNC,
      this.drawingStateService.getSyncEvent(roundId),
    );
  }

  private isNumberInRange(
    value: unknown,
    minimum: number,
    maximum: number,
  ): value is number {
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= minimum &&
      value <= maximum
    );
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
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

  private async emitToParticipant<T>(
    roomCode: string,
    participantId: string,
    event: string,
    data: T,
  ): Promise<void> {
    const channel = getRoomSocketChannel(roomCode);
    const sockets = await this.server.in(channel).fetchSockets();
    const participantSockets = sockets.filter(
      (socket) => socket.data.participantId === participantId,
    );

    for (const socket of participantSockets) {
      socket.emit(event, data);
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
