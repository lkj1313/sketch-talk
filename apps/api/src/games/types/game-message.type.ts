import type {
  GameChatMessageEvent,
  GameCorrectAnswerEvent,
  GameFinishedEvent,
  GameRoundStartedState,
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
