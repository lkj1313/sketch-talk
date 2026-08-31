import type { GameRoundTimedOutEvent } from '@sketch-talk/contracts'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RoundTimedOutNotice } from './round-timed-out-notice'

describe('RoundTimedOutNotice', () => {
  it('시간 초과와 해당 라운드의 정답을 표시한다', () => {
    const result = {
      gameSessionId: 'game-id',
      roundId: 'round-id',
      answer: '사과',
    } satisfies GameRoundTimedOutEvent

    render(<RoundTimedOutNotice result={result} />)

    expect(
      screen.getByRole('status', { name: '시간 초과 결과' }),
    ).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByText('시간 초과!')).toBeInTheDocument()
    expect(screen.getByText('사과')).toBeInTheDocument()
  })
})
