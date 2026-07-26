import type {
  RoomDetailResponse,
  RoomParticipantResponse,
  RoomStatus,
  RoomVisibility,
} from '@sketch-talk/contracts';
import { RoomHostResponseDto } from '@/rooms/dto/room-response.dto';

interface RoomDetailSource {
  id: string;
  code: string;
  title: string;
  status: RoomStatus;
  visibility: RoomVisibility;
  maxPlayers: number;
  allowMidJoin: boolean;
  hostParticipantId: string | null;
  createdAt: Date;
  hostParticipant: {
    id: string;
    nickname: string;
  };
  participants: Array<{
    id: string;
    nickname: string;
    score: number;
    isReady: boolean;
  }>;
}

export class RoomParticipantResponseDto implements RoomParticipantResponse {
  id: string;
  nickname: string;
  score: number;
  isReady: boolean;
  isHost: boolean;

  constructor(
    participant: RoomDetailSource['participants'][number],
    hostParticipantId: string | null,
  ) {
    this.id = participant.id;
    this.nickname = participant.nickname;
    this.score = participant.score;
    this.isReady = participant.isReady;
    this.isHost = participant.id === hostParticipantId;
  }
}

export class RoomDetailResponseDto implements RoomDetailResponse {
  id: string;
  code: string;
  title: string;
  status: RoomStatus;
  visibility: RoomVisibility;
  maxPlayers: number;
  allowMidJoin: boolean;
  playerCount: number;
  host: RoomHostResponseDto;
  participants: RoomParticipantResponseDto[];
  createdAt: string;

  constructor(room: RoomDetailSource) {
    this.id = room.id;
    this.code = room.code;
    this.title = room.title;
    this.status = room.status;
    this.visibility = room.visibility;
    this.maxPlayers = room.maxPlayers;
    this.allowMidJoin = room.allowMidJoin;
    this.playerCount = room.participants.length;
    this.host = new RoomHostResponseDto(room.hostParticipant);
    this.participants = room.participants.map(
      (participant) =>
        new RoomParticipantResponseDto(participant, room.hostParticipantId),
    );
    this.createdAt = room.createdAt.toISOString();
  }
}
