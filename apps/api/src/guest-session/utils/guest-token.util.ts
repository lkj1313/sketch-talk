import { createHash, randomBytes } from 'node:crypto';
import { GUEST_TOKEN_BYTE_LENGTH } from '@/guest-session/constants/guest-session.constants';

export function createGuestToken(): string {
  return randomBytes(GUEST_TOKEN_BYTE_LENGTH).toString('base64url');
}

export function hashGuestToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
