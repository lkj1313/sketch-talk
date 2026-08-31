import type { GameRoundSkippedEvent } from '@sketch-talk/contracts'
import { LogOutIcon, UsersRoundIcon } from 'lucide-react'

export type RoundSkippedNoticeProps = {
  result: GameRoundSkippedEvent
}

export function RoundSkippedNotice({ result }: RoundSkippedNoticeProps) {
  const isDrawerLeft = result.reason === 'DRAWER_LEFT'
  const Icon = isDrawerLeft ? LogOutIcon : UsersRoundIcon

  return (
    <div
      aria-label="라운드 건너뛰기 결과"
      aria-live="assertive"
      className="mt-6 rounded-xl border border-sky-500/30 bg-sky-500/10 p-5 text-center"
      role="status"
    >
      <Icon aria-hidden="true" className="mx-auto size-8 text-sky-600" />
      <p className="mt-2 text-xl font-bold">
        {isDrawerLeft ? '출제자가 나갔습니다.' : '참가자가 부족합니다.'}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        이번 라운드의 정답은{' '}
        <strong className="text-foreground">{result.answer}</strong>였습니다.
      </p>
      <p className="mt-2 text-sm font-medium">
        {isDrawerLeft
          ? '다음 라운드로 이동합니다.'
          : '게임을 종료합니다.'}
      </p>
    </div>
  )
}
