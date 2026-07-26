import type { CreateRoomRequest } from '@sketch-talk/contracts';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { RoomVisibility } from '@/generated/prisma/client';
import { trimString } from '@/common/transformers/string.transformer';

export class CreateRoomDto implements CreateRoomRequest {
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  title!: string;

  @IsEnum(RoomVisibility)
  visibility: RoomVisibility = RoomVisibility.PUBLIC;

  @IsInt()
  @Min(2)
  @Max(12)
  maxPlayers = 8;

  @IsBoolean()
  allowMidJoin = true;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname?: string;
}
