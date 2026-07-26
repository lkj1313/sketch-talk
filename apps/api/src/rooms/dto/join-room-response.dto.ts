import type {
  JoinRoomResponse,
  RoomParticipantResponse,
} from '@sketch-talk/contracts';
import {
  RoomDetailResponseDto,
  RoomParticipantResponseDto,
} from '@/rooms/dto/room-detail-response.dto';

export class JoinRoomResponseDto implements JoinRoomResponse {
  room: RoomDetailResponseDto;
  participant: RoomParticipantResponse;

  constructor(room: RoomDetailResponseDto, participantId: string) {
    const participant = room.participants.find(
      (item) => item.id === participantId,
    );

    if (!participant) {
      throw new Error('참가자 응답 정보를 찾을 수 없습니다.');
    }

    this.room = room;
    this.participant = new RoomParticipantResponseDto(participant, null);
  }
}
