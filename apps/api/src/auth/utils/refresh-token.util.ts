import { createHash, randomBytes } from 'node:crypto';
import { REFRESH_TOKEN_BYTE_LENGTH } from '@/auth/constants/auth.constants';

export function createRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTE_LENGTH).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
