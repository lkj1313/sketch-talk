import { HttpStatus } from '@nestjs/common';

export const COMMON_ERROR = {
  VALIDATION_FAILED: {
    statusCode: HttpStatus.BAD_REQUEST,
    code: 'COMMON_VALIDATION_FAILED',
    message: '입력값을 확인해주세요.',
  },
  BAD_REQUEST: {
    statusCode: HttpStatus.BAD_REQUEST,
    code: 'COMMON_BAD_REQUEST',
    message: '잘못된 요청입니다.',
  },
  UNAUTHORIZED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'COMMON_UNAUTHORIZED',
    message: '인증이 필요합니다.',
  },
  FORBIDDEN: {
    statusCode: HttpStatus.FORBIDDEN,
    code: 'COMMON_FORBIDDEN',
    message: '요청을 수행할 권한이 없습니다.',
  },
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    code: 'COMMON_NOT_FOUND',
    message: '요청한 대상을 찾을 수 없습니다.',
  },
  CONFLICT: {
    statusCode: HttpStatus.CONFLICT,
    code: 'COMMON_CONFLICT',
    message: '요청이 현재 상태와 충돌합니다.',
  },
  TOO_MANY_REQUESTS: {
    statusCode: HttpStatus.TOO_MANY_REQUESTS,
    code: 'COMMON_TOO_MANY_REQUESTS',
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
  INTERNAL_SERVER_ERROR: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'COMMON_INTERNAL_SERVER_ERROR',
    message: '서버 내부 오류가 발생했습니다.',
  },
} as const;
