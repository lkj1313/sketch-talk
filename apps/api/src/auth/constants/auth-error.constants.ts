import { HttpStatus } from '@nestjs/common';

export const AUTH_ERROR = {
  EMAIL_ALREADY_EXISTS: {
    statusCode: HttpStatus.CONFLICT,
    code: 'AUTH_EMAIL_ALREADY_EXISTS',
    message: '이미 사용 중인 이메일입니다.',
  },
  NICKNAME_ALREADY_EXISTS: {
    statusCode: HttpStatus.CONFLICT,
    code: 'AUTH_NICKNAME_ALREADY_EXISTS',
    message: '이미 사용 중인 닉네임입니다.',
  },
  USER_ALREADY_EXISTS: {
    statusCode: HttpStatus.CONFLICT,
    code: 'AUTH_USER_ALREADY_EXISTS',
    message: '이미 사용 중인 회원 정보입니다.',
  },
} as const;
