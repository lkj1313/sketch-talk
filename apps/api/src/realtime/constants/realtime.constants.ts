export const ROOM_SOCKET_NAMESPACE = '/rooms';
export const ROOM_SOCKET_PATH = '/api/v1/socket.io';

export const ROOM_SOCKET_EVENT = {
  SUBSCRIBE: 'room:subscribe',
  STATE: 'room:state',
  PARTICIPANT_JOINED: 'room:participant-joined',
  PARTICIPANT_LEFT: 'room:participant-left',
  HOST_CHANGED: 'room:host-changed',
  READY_CHANGED: 'room:ready-changed',
  GAME_STARTED: 'room:game-started',
  MESSAGE: 'game:message',
  CHAT_MESSAGE: 'game:chat-message',
  CORRECT_ANSWER: 'game:correct-answer',
  ROUND_STARTED: 'game:round-started',
  ROUND_TIMED_OUT: 'game:round-timed-out',
  GAME_FINISHED: 'game:finished',
  WORD_ASSIGNED: 'game:word-assigned',
  ERROR: 'realtime:error',
} as const;

export function getRoomSocketChannel(code: string): string {
  return `room:${code}`;
}
