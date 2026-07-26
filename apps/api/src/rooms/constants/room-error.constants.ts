import { HttpStatus } from '@nestjs/common';

export const ROOM_ERROR = {
  NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    code: 'ROOM_NOT_FOUND',
    message: '방을 찾을 수 없습니다.',
  },
  ALREADY_IN_ROOM: {
    statusCode: HttpStatus.CONFLICT,
    code: 'ROOM_ALREADY_IN_ROOM',
    message: '이미 다른 방에 참가 중입니다.',
  },
  PARTICIPANT_NOT_FOUND: {
    statusCode: HttpStatus.NOT_FOUND,
    code: 'ROOM_PARTICIPANT_NOT_FOUND',
    message: '해당 방에 참가하고 있지 않습니다.',
  },
  FULL: {
    statusCode: HttpStatus.CONFLICT,
    code: 'ROOM_FULL',
    message: '방의 정원이 가득 찼습니다.',
  },
  NOT_JOINABLE: {
    statusCode: HttpStatus.CONFLICT,
    code: 'ROOM_NOT_JOINABLE',
    message: '참가할 수 없는 상태의 방입니다.',
  },
  MID_JOIN_NOT_ALLOWED: {
    statusCode: HttpStatus.CONFLICT,
    code: 'ROOM_MID_JOIN_NOT_ALLOWED',
    message: '게임이 시작된 후에는 참가할 수 없는 방입니다.',
  },
  NICKNAME_DUPLICATED: {
    statusCode: HttpStatus.CONFLICT,
    code: 'ROOM_NICKNAME_DUPLICATED',
    message: '방에서 이미 사용 중인 닉네임입니다.',
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
