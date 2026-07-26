import type { Socket } from 'socket.io';
import type { RequestActor } from '@/auth/types/request-actor.type';

export type AuthenticatedSocket = Socket & {
  data: {
    actor?: RequestActor;
    roomCode?: string;
    participantId?: string;
  };
};
