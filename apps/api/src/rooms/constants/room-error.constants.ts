import { HttpStatus } from '@nestjs/common';

export const ROOM_ERROR = {
  ALREADY_IN_ROOM: {
    statusCode: HttpStatus.CONFLICT,
    code: 'ROOM_ALREADY_IN_ROOM',
    message: '이미 다른 방에 참가 중입니다.',
  },
  GUEST_NICKNAME_REQUIRED: {
    statusCode: HttpStatus.BAD_REQUEST,
    code: 'ROOM_GUEST_NICKNAME_REQUIRED',
    message: '비회원은 닉네임이 필요합니다.',
  },
  CODE_GENERATION_FAILED: {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'ROOM_CODE_GENERATION_FAILED',
    message: '방 코드를 생성하지 못했습니다.',
  },
} as const;
