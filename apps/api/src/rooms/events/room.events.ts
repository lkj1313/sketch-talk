import type {
  GameWordAssignedEvent,
  RoomGameStartedEvent,
  RoomHostChangedEvent,
  RoomParticipantJoinedEvent,
  RoomParticipantLeftEvent,
  RoomReadyChangedEvent,
} from '@sketch-talk/contracts';

export const ROOM_DOMAIN_EVENT = {
  PARTICIPANT_JOINED: 'room.participant.joined',
  PARTICIPANT_LEFT: 'room.participant.left',
  HOST_CHANGED: 'room.host.changed',
  READY_CHANGED: 'room.ready.changed',
  GAME_STARTED: 'room.game.started',
} as const;

export type RoomParticipantJoinedDomainEvent = RoomParticipantJoinedEvent;
export type RoomParticipantLeftDomainEvent = RoomParticipantLeftEvent;
export type RoomHostChangedDomainEvent = RoomHostChangedEvent;
export type RoomReadyChangedDomainEvent = RoomReadyChangedEvent;
export interface RoomGameStartedDomainEvent extends RoomGameStartedEvent {
  drawerParticipantId: string;
  wordAssignment: GameWordAssignedEvent;
}
