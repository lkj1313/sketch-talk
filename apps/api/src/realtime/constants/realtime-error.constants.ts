export const REALTIME_ERROR = {
  RATE_LIMIT_EXCEEDED: {
    code: 'REALTIME_RATE_LIMIT_EXCEEDED',
    message: '요청을 너무 자주 보내고 있습니다.',
  },
  INVALID_SUBSCRIBE_PAYLOAD: {
    code: 'REALTIME_INVALID_SUBSCRIBE_PAYLOAD',
    message: '올바른 6자리 방 코드가 필요합니다.',
  },
  INVALID_GAME_MESSAGE: {
    code: 'REALTIME_INVALID_GAME_MESSAGE',
    message: '채팅 메시지는 1자 이상 100자 이하여야 합니다.',
  },
  INVALID_DRAWING_STROKE: {
    code: 'REALTIME_INVALID_DRAWING_STROKE',
    message: '올바른 그림 선 데이터가 필요합니다.',
  },
  INVALID_DRAWING_CLEAR: {
    code: 'REALTIME_INVALID_DRAWING_CLEAR',
    message: '올바른 전체 지우기 요청이 필요합니다.',
  },
  DRAWING_HISTORY_LIMIT_EXCEEDED: {
    code: 'REALTIME_DRAWING_HISTORY_LIMIT_EXCEEDED',
    message: '한 라운드에서 저장할 수 있는 그림 좌표 수를 초과했습니다.',
  },
  ROOM_SUBSCRIPTION_REQUIRED: {
    code: 'REALTIME_ROOM_SUBSCRIPTION_REQUIRED',
    message: '먼저 참가 중인 방을 구독해야 합니다.',
  },
} as const;
