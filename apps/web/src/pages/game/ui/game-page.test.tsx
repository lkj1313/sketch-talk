import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GamePage } from './game-page'

const mocks = vi.hoisted(() => ({
  emit: vi.fn(),
  useCurrentRoomParticipant: vi.fn(),
  useGameRealtime: vi.fn(),
}))

vi.mock('@/entities/room', () => ({
  useCurrentRoomParticipant: mocks.useCurrentRoomParticipant,
}))

vi.mock('@/features/game-realtime', () => ({
  useGameRealtime: mocks.useGameRealtime,
}))

vi.mock('@/shared/api', () => ({
  ROOM_SOCKET_EVENT: {
    MESSAGE: 'game:message',
  },
  roomSocket: {
    emit: mocks.emit,
  },
}))

function renderGamePage(): void {
  render(
    <MemoryRouter initialEntries={['/rooms/ABC234/games/game-id']}>
      <Routes>
        <Route
          path="/rooms/:roomCode/games/:gameId"
          element={<GamePage />}
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T00:00:00.000Z'))
    mocks.useCurrentRoomParticipant.mockReturnValue({
      data: { id: 'participant-id' },
    })
    mocks.useGameRealtime.mockReturnValue({
      gameState: {
        gameSessionId: 'game-id',
        roundId: 'round-id',
        roundNumber: 1,
        totalRounds: 6,
        drawer: { id: 'drawer-id', nickname: '그림왕' },
        difficulty: 'EASY',
        startedAt: '2026-08-27T00:00:00.000Z',
        expiresAt: '2026-08-27T00:02:00.000Z',
      },
      assignedWord: '사과',
      correctAnswer: null,
      roundTimedOut: null,
      gameResult: null,
      messages: [],
      isConnected: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('주소의 방 코드와 게임 ID로 실시간 상태를 연결한다', () => {
    renderGamePage()

    expect(screen.getByRole('heading', { name: '게임' })).toBeInTheDocument()
    expect(mocks.useGameRealtime).toHaveBeenCalledWith({
      roomCode: 'ABC234',
      gameId: 'game-id',
    })
  })

  it('현재 라운드와 출제자용 제시어를 표시한다', () => {
    renderGamePage()

    expect(screen.getByText('1 / 6')).toBeInTheDocument()
    expect(screen.getByText('그림왕')).toBeInTheDocument()
    expect(screen.getByText('쉬움')).toBeInTheDocument()
    expect(screen.getByText('120초')).toBeInTheDocument()
    expect(screen.getByText('사과')).toBeInTheDocument()
    expect(screen.getByText('실시간 연결됨')).toBeInTheDocument()
  })

  it('입력한 채팅 메시지를 게임 소켓으로 전송한다', () => {
    renderGamePage()

    const input = screen.getByRole('textbox', { name: '채팅 메시지' })

    fireEvent.change(input, { target: { value: '안녕하세요' } })
    fireEvent.submit(screen.getByRole('form', { name: '채팅 메시지 전송' }))

    expect(mocks.emit).toHaveBeenCalledWith('game:message', {
      message: '안녕하세요',
    })
    expect(input).toHaveValue('')
  })

  it('서버에서 받은 채팅과 본인 메시지 여부를 표시한다', () => {
    mocks.useGameRealtime.mockReturnValue({
      gameState: {
        gameSessionId: 'game-id',
        roundId: 'round-id',
        roundNumber: 1,
        totalRounds: 6,
        drawer: { id: 'drawer-id', nickname: '그림왕' },
        difficulty: 'EASY',
        startedAt: '2026-08-27T00:00:00.000Z',
        expiresAt: '2026-08-27T00:02:00.000Z',
      },
      assignedWord: null,
      correctAnswer: null,
      roundTimedOut: null,
      gameResult: null,
      messages: [
        {
          participant: { id: 'participant-id', nickname: '현재 참가자' },
          message: '제가 보낸 메시지입니다.',
          sentAt: '2026-08-27T00:00:10.000Z',
        },
      ],
      isConnected: true,
    })

    renderGamePage()

    expect(screen.getByText('제가 보낸 메시지입니다.')).toBeInTheDocument()
    expect(screen.getByText('나')).toBeInTheDocument()
  })

  it('게임 종료 결과를 받으면 최종 순위 화면을 표시한다', () => {
    mocks.useGameRealtime.mockReturnValue({
      gameState: null,
      assignedWord: null,
      correctAnswer: null,
      roundTimedOut: null,
      gameResult: {
        gameSessionId: 'game-id',
        scores: [
          { participantId: 'participant-id', nickname: '현재 참가자', score: 300 },
          { participantId: 'other-id', nickname: '다른 참가자', score: 500 },
        ],
        endedAt: '2026-08-31T10:10:00.000Z',
      },
      messages: [],
      isConnected: true,
    })

    renderGamePage()

    expect(screen.getByRole('heading', { name: '게임 종료' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: '최종 순위' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '채팅 메시지' })).not.toBeInTheDocument()
  })

  it('게임 상태를 받기 전에는 로딩 상태를 표시한다', () => {
    mocks.useGameRealtime.mockReturnValue({
      gameState: null,
      assignedWord: null,
      correctAnswer: null,
      roundTimedOut: null,
      gameResult: null,
      messages: [],
      isConnected: false,
    })

    renderGamePage()

    expect(
      screen.getByRole('status', { name: '게임 상태 불러오는 중' }),
    ).toBeInTheDocument()
    expect(screen.getByText('실시간 연결 중')).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: '채팅 메시지' }),
    ).toBeDisabled()
  })
})
