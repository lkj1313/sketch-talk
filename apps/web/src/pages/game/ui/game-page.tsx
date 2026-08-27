import { useParams } from 'react-router-dom'

import { useGameRealtime } from '@/features/game/realtime'
import { Spinner } from '@/shared/ui'

import { useRoundCountdown } from '../model/use-round-countdown'

const DIFFICULTY_LABEL = {
  EASY: '쉬움',
  MEDIUM: '보통',
  HARD: '어려움',
} as const

export function GamePage() {
  const { roomCode = '', gameId = '' } = useParams()
  const normalizedRoomCode = roomCode.trim().toUpperCase()
  const { gameState, assignedWord, isConnected } = useGameRealtime({
    roomCode: normalizedRoomCode,
    gameId,
  })
  const remainingSeconds = useRoundCountdown(gameState?.expiresAt)

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">게임</h1>
            <p className="mt-1 font-mono text-sm font-semibold text-muted-foreground">
              방 코드 {normalizedRoomCode}
            </p>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}
            />
            {isConnected ? '실시간 연결됨' : '실시간 연결 중'}
          </p>
        </header>

        {!gameState ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3">
            <Spinner className="size-8" aria-label="게임 상태 불러오는 중" />
            <p className="text-sm text-muted-foreground">
              진행 중인 게임 정보를 불러오고 있습니다.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <GameStateItem
              label="라운드"
              value={`${gameState.roundNumber} / ${gameState.totalRounds}`}
            />
            <GameStateItem label="출제자" value={gameState.drawer.nickname} />
            <GameStateItem
              label="난이도"
              value={DIFFICULTY_LABEL[gameState.difficulty]}
            />
            <GameStateItem label="남은 시간" value={`${remainingSeconds}초`} />

            <section className="rounded-xl border bg-background p-5 sm:col-span-2 lg:col-span-4">
              {assignedWord ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    제시어
                  </p>
                  <p className="mt-2 text-3xl font-bold">{assignedWord}</p>
                </div>
              ) : (
                <p className="text-center font-medium">
                  {gameState.drawer.nickname}님이 그림을 그리고 있습니다.
                </p>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  )
}

type GameStateItemProps = {
  label: string
  value: string
}

function GameStateItem({ label, value }: GameStateItemProps) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
