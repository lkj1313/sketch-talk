import { Transform } from 'class-transformer';
import type { LoginRequest } from '@sketch-talk/contracts';
import {
  IsByteLength,
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { normalizeEmail } from '@/common/transformers/string.transformer';

export class LoginDto implements LoginRequest {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsByteLength(0, 72)
  password!: string;
}
