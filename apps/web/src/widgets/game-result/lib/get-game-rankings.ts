import type { GameFinishedEvent } from '@sketch-talk/contracts'

export type RankedGameScore = GameFinishedEvent['scores'][number] & {
  rank: number
}

export function getGameRankings(
  scores: GameFinishedEvent['scores'],
): RankedGameScore[] {
  const sortedScores = [...scores].sort((a, b) => b.score - a.score)

  return sortedScores.map((score) => {
    const firstIndex = sortedScores.findIndex(
      (ranking) => ranking.score === score.score,
    )

    return {
      ...score,
      rank: firstIndex + 1,
    }
  })
}
