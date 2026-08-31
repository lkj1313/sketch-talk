import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GameChat } from './game-chat'

describe('GameChat', () => {
  it('채팅 영역의 제목과 빈 상태를 표시한다', () => {
    render(<GameChat messages={[]} />)

    expect(screen.getByRole('region', { name: '채팅' })).toBeInTheDocument()
    expect(
      screen.getByText('아직 채팅 메시지가 없습니다.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('게임 참가자들과 대화를 시작해보세요.'),
    ).toBeInTheDocument()
  })

  it('다른 참가자와 내 메시지를 구분해 표시한다', () => {
    render(
      <GameChat
        currentParticipantId="participant-1"
        messages={[
          {
            participant: { id: 'participant-2', nickname: '그림왕' },
            message: '안녕하세요!',
            sentAt: '2026-08-31T13:00:00.000Z',
          },
          {
            participant: { id: 'participant-1', nickname: '현재 사용자' },
            message: '반갑습니다.',
            sentAt: '2026-08-31T13:01:00.000Z',
          },
        ]}
      />,
    )

    expect(screen.getByRole('list', { name: '채팅 메시지' })).toBeInTheDocument()
    expect(screen.getByText('그림왕')).toBeInTheDocument()
    expect(screen.getByText('나')).toBeInTheDocument()
    expect(screen.getByText('안녕하세요!')).toBeInTheDocument()
    expect(screen.getByText('반갑습니다.')).toBeInTheDocument()
  })

  it('공백 없는 긴 메시지를 줄바꿈할 수 있게 표시한다', () => {
    const longMessage = 'ㅋ'.repeat(80)

    render(
      <GameChat
        messages={[
          {
            participant: { id: 'participant-2', nickname: '그림왕' },
            message: longMessage,
            sentAt: '2026-08-31T13:00:00.000Z',
          },
        ]}
      />,
    )

    expect(screen.getByText(longMessage)).toHaveClass(
      'break-words',
      '[overflow-wrap:anywhere]',
    )
  })
})
