import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ActorRequest } from '@/auth/types/auth-request.type';
import type { RequestActor } from '@/auth/types/request-actor.type';

export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): RequestActor => {
    const request = context.switchToHttp().getRequest<ActorRequest>();

    return request.actor;
  },
);
