import type {
  RoomDetailResponse,
  RoomParticipantResponse,
} from "./room.js";
import type { GameRoundStartedState } from "./game.js";

export interface RoomSubscribeRequest {
  code: string;
}

export interface RoomParticipantJoinedEvent {
  roomCode: string;
  participant: RoomParticipantResponse;
  playerCount: number;
}

export interface RoomParticipantLeftEvent {
  roomCode: string;
  participantId: string;
  playerCount: number;
  roomDeleted: boolean;
}

export interface RoomHostChangedEvent {
  roomCode: string;
  host: {
    id: string;
    nickname: string;
  };
}

export interface RoomReadyChangedEvent {
  roomCode: string;
  participant: RoomParticipantResponse;
}

export interface RoomGameStartedEvent {
  roomCode: string;
  room: RoomDetailResponse;
  game: GameRoundStartedState;
}

export interface RealtimeErrorResponse {
  code: string;
  message: string;
}
