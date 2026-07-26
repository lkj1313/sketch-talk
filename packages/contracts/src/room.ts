export type RoomStatus = "WAITING" | "PLAYING" | "FINISHED" | "CLOSED";

export type RoomVisibility = "PUBLIC" | "PRIVATE";

export interface CreateRoomRequest {
  title: string;
  visibility?: RoomVisibility;
  maxPlayers?: number;
  allowMidJoin?: boolean;
  nickname?: string;
}

export interface RoomHostResponse {
  id: string;
  nickname: string;
}

export interface RoomResponse {
  id: string;
  code: string;
  title: string;
  status: RoomStatus;
  visibility: RoomVisibility;
  maxPlayers: number;
  allowMidJoin: boolean;
  playerCount: number;
  host: RoomHostResponse;
  createdAt: string;
}
