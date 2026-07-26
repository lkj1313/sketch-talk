import { Request } from 'express';
import { AccessTokenPayload } from '@/auth/types/auth-response.type';
import type { RequestActor } from '@/auth/types/request-actor.type';

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

export interface ActorRequest extends Request {
  actor: RequestActor;
}
