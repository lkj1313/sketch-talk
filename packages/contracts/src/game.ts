export type WordDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface GameRoundStartedState {
  gameSessionId: string;
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  drawer: {
    id: string;
    nickname: string;
  };
  difficulty: WordDifficulty;
  startedAt: string;
  expiresAt: string;
}

export interface GameWordAssignedEvent {
  gameSessionId: string;
  roundId: string;
  answer: string;
}

export interface GameMessageRequest {
  message: string;
}

export interface GameChatMessageEvent {
  participant: {
    id: string;
    nickname: string;
  };
  message: string;
  sentAt: string;
}

export interface GameCorrectAnswerEvent {
  gameSessionId: string;
  roundId: string;
  answer: string;
  guesser: {
    id: string;
    nickname: string;
    awardedScore: number;
  };
  drawer: {
    id: string;
    nickname: string;
    awardedScore: number;
  };
}

export interface GameFinishedEvent {
  gameSessionId: string;
  scores: Array<{
    participantId: string;
    nickname: string;
    score: number;
  }>;
  endedAt: string;
}

export interface GameRoundTimedOutEvent {
  gameSessionId: string;
  roundId: string;
  answer: string;
}
