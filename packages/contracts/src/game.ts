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
}

export interface GameWordAssignedEvent {
  gameSessionId: string;
  roundId: string;
  answer: string;
}
