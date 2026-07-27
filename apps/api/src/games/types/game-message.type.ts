import type {
  GameChatMessageEvent,
  GameCorrectAnswerEvent,
  GameFinishedEvent,
  GameRoundStartedState,
  GameRoundTimedOutEvent,
  GameWordAssignedEvent,
} from '@sketch-talk/contracts';

export type SubmitGameMessageResult =
  | {
      type: 'CHAT';
      chat: GameChatMessageEvent;
    }
  | {
      type: 'CORRECT';
      correctAnswer: GameCorrectAnswerEvent;
      nextRound: GameRoundStartedState;
      nextDrawerParticipantId: string;
      wordAssignment: GameWordAssignedEvent;
    }
  | {
      type: 'FINISHED';
      correctAnswer: GameCorrectAnswerEvent;
      finished: GameFinishedEvent;
    };

export type AdvanceGameResult =
  | {
      type: 'NEXT';
      nextRound: GameRoundStartedState;
      nextDrawerParticipantId: string;
      wordAssignment: GameWordAssignedEvent;
    }
  | {
      type: 'FINISHED';
      finished: GameFinishedEvent;
    };

export type ExpireGameRoundResult =
  | ({
      roomCode: string;
      timedOut: GameRoundTimedOutEvent;
    } & AdvanceGameResult)
  | null;
