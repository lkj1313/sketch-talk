import type { GameFinishedEvent } from '@sketch-talk/contracts'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { GameResultScreen } from './game-result-screen'

const result = {
  gameSessionId: 'game-id',
  scores: [
    { participantId: 'participant-2', nickname: '연필장인', score: 350 },
    { participantId: 'participant-1', nickname: '그림왕', score: 500 },
    { participantId: 'participant-3', nickname: '지우개왕', score: 200 },
  ],
  endedAt: '2026-08-31T10:10:00.000Z',
} satisfies GameFinishedEvent

function renderResult(gameResult: GameFinishedEvent = result): void {
  render(
    <MemoryRouter>
      <GameResultScreen
        currentParticipantId="participant-2"
        result={gameResult}
      />
    </MemoryRouter>,
  )
}

describe('GameResultScreen', () => {
  it('점수 순서로 최종 순위를 표시하고 현재 참가자를 구분한다', () => {
    renderResult()

    const rankings = screen.getByRole('list', { name: '최종 순위' })
    const items = within(rankings).getAllByRole('listitem')

    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('그림왕')
    expect(items[0]).toHaveTextContent('500점')
    expect(items[1]).toHaveTextContent('연필장인')
    expect(items[1]).toHaveTextContent('나')
    expect(items[1]).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: '로비로 이동' })).toHaveAttribute(
      'href',
      '/lobby',
    )
  })

  it('참가자 부족으로 종료된 이유를 표시한다', () => {
    renderResult({
      ...result,
      reason: 'NOT_ENOUGH_PARTICIPANTS',
    })

    expect(
      screen.getByText('참가자가 부족하여 게임이 종료되었습니다.'),
    ).toBeInTheDocument()
  })
})
