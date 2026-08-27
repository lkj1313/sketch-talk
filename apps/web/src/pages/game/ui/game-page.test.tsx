import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GamePage } from './game-page'

const mocks = vi.hoisted(() => ({
  useGameRealtime: vi.fn(),
}))

vi.mock('@/features/game/realtime', () => ({
  useGameRealtime: mocks.useGameRealtime,
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
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-27T00:00:00.000Z'))
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

  it('게임 상태를 받기 전에는 로딩 상태를 표시한다', () => {
    mocks.useGameRealtime.mockReturnValue({
      gameState: null,
      assignedWord: null,
      isConnected: false,
    })

    renderGamePage()

    expect(
      screen.getByRole('status', { name: '게임 상태 불러오는 중' }),
    ).toBeInTheDocument()
    expect(screen.getByText('실시간 연결 중')).toBeInTheDocument()
  })
})
