import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsByteLength,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

function normalizeEmail({ value }: TransformFnParams): unknown {
  return typeof value === 'string'
    ? value.trim().toLowerCase()
    : (value as unknown);
}

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : (value as unknown);
}

export class SignupDto {
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
