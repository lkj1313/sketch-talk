import type { JoinRoomRequest } from '@sketch-talk/contracts';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '@/common/transformers/string.transformer';

export class JoinRoomDto implements JoinRoomRequest {
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname?: string;
}
