import { Transform } from 'class-transformer';
import type { SignupRequest } from '@sketch-talk/contracts';
import {
  IsByteLength,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  normalizeEmail,
  trimString,
} from '@/common/transformers/string.transformer';

export class SignupDto implements SignupRequest {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @MinLength(12)
  @IsByteLength(0, 72)
  password!: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  nickname!: string;
}
