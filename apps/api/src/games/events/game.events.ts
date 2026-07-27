import type { ExpireGameRoundResult } from '@/games/types/game-message.type';

export const GAME_DOMAIN_EVENT = {
  ROUND_TIMED_OUT: 'game.round.timed-out',
} as const;

export type GameRoundTimedOutDomainEvent = NonNullable<ExpireGameRoundResult>;
