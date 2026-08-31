import type { GameCorrectAnswerEvent } from '@sketch-talk/contracts'
import { TrophyIcon } from 'lucide-react'

export type CorrectAnswerNoticeProps = {
  result: GameCorrectAnswerEvent
}

export function CorrectAnswerNotice({ result }: CorrectAnswerNoticeProps) {
  return (
    <div
      aria-label="정답 결과"
      aria-live="assertive"
      className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center"
      role="status"
    >
      <TrophyIcon
        aria-hidden="true"
        className="mx-auto size-8 text-emerald-600"
      />
      <p className="mt-2 text-xl font-bold">
        {result.guesser.nickname}님 정답!
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        정답 <strong className="text-foreground">{result.answer}</strong>
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-medium">
        <span>정답자 +{result.guesser.awardedScore}점</span>
        <span>출제자 +{result.drawer.awardedScore}점</span>
      </div>
    </div>
  )
}
