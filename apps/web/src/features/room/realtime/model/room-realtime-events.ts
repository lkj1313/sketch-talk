export const ROOM_REALTIME_EVENT = {
  SUBSCRIBE: 'room:subscribe',
  STATE: 'room:state',
  PARTICIPANT_JOINED: 'room:participant-joined',
  PARTICIPANT_LEFT: 'room:participant-left',
  HOST_CHANGED: 'room:host-changed',
  READY_CHANGED: 'room:ready-changed',
  GAME_STARTED: 'room:game-started',
  ERROR: 'realtime:error',
} as const
