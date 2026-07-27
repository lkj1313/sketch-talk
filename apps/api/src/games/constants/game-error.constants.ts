import { HttpStatus } from '@nestjs/common';

export const GAME_ERROR = {
  WORD_POOL_EMPTY: {
    statusCode: HttpStatus.SERVICE_UNAVAILABLE,
    code: 'GAME_WORD_POOL_EMPTY',
    message: '사용할 수 있는 제시어가 없어 게임을 시작할 수 없습니다.',
  },
} as const;
