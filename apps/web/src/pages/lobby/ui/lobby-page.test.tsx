import type { RoomResponse } from '@sketch-talk/contracts'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session'

import { LobbyPage } from './lobby-page'

const mocks = vi.hoisted(() => ({
  useRooms: vi.fn(),
  refetchRooms: vi.fn(),
}))

vi.mock('@/entities/room', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/entities/room')>()

  return {
    ...original,
    useRooms: mocks.useRooms,
  }
})

vi.mock('@/features/room/create', () => ({
  CreateRoomDialog: () => <button type="button">방 만들기</button>,
}))

const room: RoomResponse = {
  id: 'room-id',
  code: 'ABC123',
  title: '즐거운 그림방',
  status: 'WAITING',
  visibility: 'PUBLIC',
  maxPlayers: 8,
  allowMidJoin: true,
  playerCount: 3,
  host: {
    id: 'host-id',
    nickname: '방장님',
  },
  createdAt: '2026-08-26T00:00:00.000Z',
}

function mockRoomsQuery(
  state: Partial<{
    isPending: boolean
    isError: boolean
    isFetching: boolean
    data: {
      rooms: RoomResponse[]
      meta: {
        total: number
        page: number
        pageSize: number
        hasNext: boolean
      }
    }
  }> = {},
): void {
  mocks.useRooms.mockReturnValue({
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: mocks.refetchRooms,
    data: {
      rooms: [room],
      meta: {
        total: 1,
        page: 1,
        pageSize: 12,
        hasNext: false,
      },
    },
    ...state,
  })
}

function renderLobby(): void {
  render(
    <MemoryRouter>
      <LobbyPage />
    </MemoryRouter>,
  )
}

describe('LobbyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useSessionStore.getState().clearSession()
    mockRoomsQuery()
  })

  it('방 목록을 불러오는 동안 로딩 상태를 표시한다', () => {
    mockRoomsQuery({ isPending: true, data: undefined })

    renderLobby()

    expect(
      screen.getByRole('status', { name: '방 목록 불러오는 중' }),
    ).toBeInTheDocument()
  })

  it('조회한 방 정보와 상세 화면 링크를 표시한다', () => {
    renderLobby()

    expect(
      screen.getByRole('heading', { name: '즐거운 그림방' }),
    ).toBeInTheDocument()
    expect(screen.getByText('방장 방장님')).toBeInTheDocument()
    expect(screen.getByText('3/8')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: '즐거운 그림방 방 보기' }),
    ).toHaveAttribute('href', '/rooms/ABC123')
  })

  it('조회된 방이 없으면 빈 목록 안내를 표시한다', () => {
    mockRoomsQuery({
      data: {
        rooms: [],
        meta: {
          total: 0,
          page: 1,
          pageSize: 12,
          hasNext: false,
        },
      },
    })

    renderLobby()

    expect(screen.getByText('현재 대기 중인 방이 없습니다.')).toBeInTheDocument()
  })

  it('방 목록 조회에 실패하면 다시 요청할 수 있다', () => {
    mockRoomsQuery({ isError: true, data: undefined })

    renderLobby()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(
      screen.getByText('방 목록을 불러오지 못했습니다.'),
    ).toBeInTheDocument()
    expect(mocks.refetchRooms).toHaveBeenCalledOnce()
  })

  it('게임 중 필터를 선택하면 첫 페이지부터 다시 조회한다', () => {
    renderLobby()
    fireEvent.click(screen.getByRole('button', { name: '게임 중' }))

    expect(mocks.useRooms).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 12,
      status: 'PLAYING',
    })
  })
})
