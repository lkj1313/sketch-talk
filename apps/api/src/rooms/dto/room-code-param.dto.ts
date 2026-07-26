import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';
import { normalizeRoomCode } from '@/rooms/utils/room-code.util';

export class RoomCodeParamDto {
  @Transform(normalizeRoomCode)
  @IsString()
  @Matches(/^[A-HJ-NP-Z2-9]{6}$/)
  code!: string;
}
