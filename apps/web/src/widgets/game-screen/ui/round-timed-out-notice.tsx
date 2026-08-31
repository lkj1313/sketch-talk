import type { GameRoundTimedOutEvent } from '@sketch-talk/contracts'
import { ClockAlertIcon } from 'lucide-react'

export type RoundTimedOutNoticeProps = {
  result: GameRoundTimedOutEvent
}

export function RoundTimedOutNotice({ result }: RoundTimedOutNoticeProps) {
  return (
    <div
      aria-label="시간 초과 결과"
      aria-live="assertive"
      className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center"
      role="status"
    >
      <ClockAlertIcon
        aria-hidden="true"
        className="mx-auto size-8 text-amber-600"
      />
      <p className="mt-2 text-xl font-bold">시간 초과!</p>
      <p className="mt-1 text-sm text-muted-foreground">
        정답은 <strong className="text-foreground">{result.answer}</strong>
        였습니다.
      </p>
    </div>
  )
}
