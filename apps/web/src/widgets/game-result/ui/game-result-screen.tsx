import type { GameFinishedEvent } from '@sketch-talk/contracts'
import { CrownIcon, TrophyIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/shared/ui'

export type GameResultScreenProps = {
  result: GameFinishedEvent
  currentParticipantId?: string
}

export function GameResultScreen({
  result,
  currentParticipantId,
}: GameResultScreenProps) {
  const rankings = [...result.scores].sort((a, b) => b.score - a.score)

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8">
        <TrophyIcon
          aria-hidden="true"
          className="mx-auto size-12 text-amber-500"
        />
        <h1 className="mt-3 text-3xl font-bold tracking-tight">게임 종료</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {result.reason === 'NOT_ENOUGH_PARTICIPANTS'
            ? '참가자가 부족하여 게임이 종료되었습니다.'
            : '모든 라운드가 종료되었습니다.'}
        </p>

        <ol aria-label="최종 순위" className="mt-8 space-y-3 text-left">
          {rankings.map((score, index) => {
            const rank = getRank(rankings, index)
            const isCurrentParticipant =
              score.participantId === currentParticipantId

            return (
              <li
                key={score.participantId}
                aria-current={isCurrentParticipant ? 'true' : undefined}
                className="flex items-center gap-3 rounded-xl border bg-background px-4 py-3"
              >
                <span className="flex w-10 shrink-0 items-center justify-center font-bold">
                  {rank === 1 ? (
                    <CrownIcon
                      aria-label="1위"
                      className="size-6 text-amber-500"
                    />
                  ) : (
                    `${rank}위`
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {score.nickname}
                  {isCurrentParticipant && (
                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      나
                    </span>
                  )}
                </span>
                <strong className="shrink-0 text-lg">{score.score}점</strong>
              </li>
            )
          })}
        </ol>

        <Button
          className="mt-8"
          render={<Link to="/lobby" />}
          size="lg"
        >
          로비로 이동
        </Button>
      </section>
    </main>
  )
}

function getRank(
  rankings: GameFinishedEvent['scores'],
  index: number,
): number {
  const score = rankings[index]?.score
  const firstIndex = rankings.findIndex((ranking) => ranking.score === score)

  return firstIndex + 1
}
