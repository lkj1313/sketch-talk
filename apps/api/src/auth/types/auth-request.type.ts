import { Request } from 'express';
import { AccessTokenPayload } from '@/auth/types/auth-response.type';

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}
