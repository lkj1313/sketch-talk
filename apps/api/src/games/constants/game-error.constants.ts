import { HttpStatus } from '@nestjs/common';

export const GAME_ERROR = {
  NOT_PLAYING: {
    statusCode: HttpStatus.CONFLICT,
    code: 'GAME_NOT_PLAYING',
    message: '진행 중인 게임이 없습니다.',
  },
  ROUND_NOT_ACTIVE: {
    statusCode: HttpStatus.CONFLICT,
    code: 'GAME_ROUND_NOT_ACTIVE',
    message: '진행 중인 라운드가 없습니다.',
  },
  PARTICIPANT_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    code: 'GAME_PARTICIPANT_NOT_FOUND',
    message: '게임 참가자를 찾을 수 없습니다.',
  },
  DRAWING_NOT_ALLOWED: {
    statusCode: HttpStatus.FORBIDDEN,
    code: 'GAME_DRAWING_NOT_ALLOWED',
    message: '현재 출제자만 그림을 그릴 수 있습니다.',
  },
  WORD_POOL_EMPTY: {
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    code: 'GAME_WORD_POOL_EMPTY',
    message: '사용할 수 있는 제시어가 없어 게임을 시작할 수 없습니다.',
  },
} as const;
