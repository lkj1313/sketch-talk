export interface MemberGameStats {
  gamesPlayed: number;
  wins: number;
  totalScore: number;
  bestScore: number;
}

export interface MemberGameHistory {
  gameSessionId: string;
  roomTitle: string;
  score: number;
  rank: number;
  playerCount: number;
  endedAt: string;
}

export interface MemberGameRecordResponse {
  stats: MemberGameStats;
  recentGames: MemberGameHistory[];
}
