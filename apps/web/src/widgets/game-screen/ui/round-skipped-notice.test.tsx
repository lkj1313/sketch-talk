import type { GameRoundSkippedEvent } from '@sketch-talk/contracts'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { RoundSkippedNotice } from './round-skipped-notice'

function renderNotice(reason: GameRoundSkippedEvent['reason']): void {
  render(
    <RoundSkippedNotice
      result={{
        gameSessionId: 'game-id',
        roundId: 'round-id',
        answer: '사과',
        reason,
      }}
    />,
  )
}

describe('RoundSkippedNotice', () => {
  it('출제자 퇴장과 다음 라운드 이동을 안내한다', () => {
    renderNotice('DRAWER_LEFT')

    expect(
      screen.getByRole('status', { name: '라운드 건너뛰기 결과' }),
    ).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByText('출제자가 나갔습니다.')).toBeInTheDocument()
    expect(screen.getByText('사과')).toBeInTheDocument()
    expect(screen.getByText('다음 라운드로 이동합니다.')).toBeInTheDocument()
  })

  it('참가자 부족과 게임 종료를 안내한다', () => {
    renderNotice('NOT_ENOUGH_PARTICIPANTS')

    expect(screen.getByText('참가자가 부족합니다.')).toBeInTheDocument()
    expect(screen.getByText('게임을 종료합니다.')).toBeInTheDocument()
  })
})
