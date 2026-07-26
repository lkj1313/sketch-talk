import type {
  RoomHostResponse,
  RoomResponse,
  RoomStatus,
  RoomVisibility,
} from '@sketch-talk/contracts';

interface RoomSource {
  id: string;
  code: string;
  title: string;
  status: RoomStatus;
  visibility: RoomVisibility;
  maxPlayers: number;
  allowMidJoin: boolean;
  createdAt: Date;
}

interface RoomHostSource {
  id: string;
  nickname: string;
}

export class RoomHostResponseDto implements RoomHostResponse {
  id: string;
  nickname: string;

  constructor(host: RoomHostSource) {
    this.id = host.id;
    this.nickname = host.nickname;
  }
}

export class RoomResponseDto implements RoomResponse {
  id: string;
  code: string;
  title: string;
  status: RoomStatus;
  visibility: RoomVisibility;
  maxPlayers: number;
  allowMidJoin: boolean;
  playerCount: number;
  host: RoomHostResponseDto;
  createdAt: string;

  constructor(room: RoomSource, host: RoomHostSource, playerCount: number) {
    this.id = room.id;
    this.code = room.code;
    this.title = room.title;
    this.status = room.status;
    this.visibility = room.visibility;
    this.maxPlayers = room.maxPlayers;
    this.allowMidJoin = room.allowMidJoin;
    this.playerCount = playerCount;
    this.host = new RoomHostResponseDto(host);
    this.createdAt = room.createdAt.toISOString();
  }
}
