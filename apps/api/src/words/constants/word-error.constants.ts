import { HttpStatus } from '@nestjs/common';

export const WORD_ERROR = {
  KIMI_REQUEST_FAILED: {
    statusCode: HttpStatus.BAD_GATEWAY,
    code: 'WORD_KIMI_REQUEST_FAILED',
    message: '제시어 생성 서비스 호출에 실패했습니다.',
  },
  INVALID_KIMI_RESPONSE: {
    statusCode: HttpStatus.BAD_GATEWAY,
    code: 'WORD_INVALID_KIMI_RESPONSE',
    message: '제시어 생성 서비스가 올바르지 않은 응답을 반환했습니다.',
  },
} as const;
