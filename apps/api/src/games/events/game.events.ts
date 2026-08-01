import type {
  ExpireGameRoundResult,
  ParticipantLeaveGameResult,
} from '@/games/types/game-message.type';

export const GAME_DOMAIN_EVENT = {
  ROUND_TIMED_OUT: 'game.round.timed-out',
  PARTICIPANT_LEFT: 'game.participant.left',
} as const;

export type GameRoundTimedOutDomainEvent = NonNullable<ExpireGameRoundResult>;
export type GameParticipantLeftDomainEvent = ParticipantLeaveGameResult;
