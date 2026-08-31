import type { GameCorrectAnswerEvent } from '@sketch-talk/contracts'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CorrectAnswerNotice } from './correct-answer-notice'

describe('CorrectAnswerNotice', () => {
  it('정답자와 정답 및 획득 점수를 표시한다', () => {
    const result = {
      gameSessionId: 'game-id',
      roundId: 'round-id',
      answer: '사과',
      guesser: {
        id: 'guesser-id',
        nickname: '그림왕',
        awardedScore: 100,
      },
      drawer: {
        id: 'drawer-id',
        nickname: '연필장인',
        awardedScore: 50,
      },
    } satisfies GameCorrectAnswerEvent

    render(<CorrectAnswerNotice result={result} />)

    expect(
      screen.getByRole('status', { name: '정답 결과' }),
    ).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByText('그림왕님 정답!')).toBeInTheDocument()
    expect(screen.getByText('사과')).toBeInTheDocument()
    expect(screen.getByText('정답자 +100점')).toBeInTheDocument()
    expect(screen.getByText('출제자 +50점')).toBeInTheDocument()
  })
})
