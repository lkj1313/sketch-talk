import { HttpStatus } from '@nestjs/common';

export const GUEST_SESSION_ERROR = {
  INVALID_TOKEN: {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'GUEST_SESSION_INVALID_TOKEN',
    message: '유효하지 않은 Guest Token입니다.',
  },
  EXPIRED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'GUEST_SESSION_EXPIRED',
    message: '만료된 비회원 세션입니다.',
  },
} as const;
