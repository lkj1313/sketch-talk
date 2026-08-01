import type {
  GameReconnectState,
  GameRoundStartedState,
  GameWordAssignedEvent,
} from '@sketch-talk/contracts';

export interface StartGameRoom {
  id: string;
  code: string;
  title: string;
  participants: Array<{
    id: string;
    nickname: string;
  }>;
}

export interface StartGameResult {
  game: GameRoundStartedState;
  drawerParticipantId: string;
  wordAssignment: GameWordAssignedEvent;
}

export interface GameReconnectResult {
  game: GameReconnectState;
  wordAssignment?: GameWordAssignedEvent;
}
