import { randomInt } from 'node:crypto';
import {
  ROOM_CODE_CHARACTERS,
  ROOM_CODE_LENGTH,
} from '@/rooms/constants/room.constants';

export function createRoomCode(): string {
  return Array.from(
    { length: ROOM_CODE_LENGTH },
    () => ROOM_CODE_CHARACTERS[randomInt(ROOM_CODE_CHARACTERS.length)],
  ).join('');
}
