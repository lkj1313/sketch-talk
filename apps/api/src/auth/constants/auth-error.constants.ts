import { HttpStatus } from '@nestjs/common';

export const AUTH_ERROR = {
  ACTOR_REQUIRED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'AUTH_ACTOR_REQUIRED',
    message: '회원 Access Token 또는 비회원 Guest Token이 필요합니다.',
  },
  REFRESH_TOKEN_REQUIRED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'AUTH_REFRESH_TOKEN_REQUIRED',
    message: 'Refresh Token이 필요합니다.',
  },
  INVALID_REFRESH_TOKEN: {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'AUTH_INVALID_REFRESH_TOKEN',
    message: '유효하지 않거나 만료된 Refresh Token입니다.',
  },
  ACCESS_TOKEN_REQUIRED: {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'AUTH_ACCESS_TOKEN_REQUIRED',
    message: 'Access Token이 필요합니다.',
  },
  INVALID_ACCESS_TOKEN: {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'AUTH_INVALID_ACCESS_TOKEN',
    message: '유효하지 않거나 만료된 Access Token입니다.',
  },
  INVALID_CREDENTIALS: {
    statusCode: HttpStatus.UNAUTHORIZED,
    code: 'AUTH_INVALID_CREDENTIALS',
    message: '이메일 또는 비밀번호가 올바르지 않습니다.',
  },
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
