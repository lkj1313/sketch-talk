import type {
  RoomDetailResponse,
  RoomParticipantResponse,
} from '@sketch-talk/contracts'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RoomPage } from './room-page'

const mocks = vi.hoisted(() => ({
  useRoom: vi.fn(),
  useCurrentRoomParticipant: vi.fn(),
  refetchRoom: vi.fn(),
  refetchCurrentParticipant: vi.fn(),
}))

vi.mock('@/entities/room', () => ({
  useRoom: mocks.useRoom,
  useCurrentRoomParticipant: mocks.useCurrentRoomParticipant,
}))

vi.mock('@/features/room/join', () => ({
  JoinRoomForm: ({ code }: { code: string }) => (
    <p>참가 양식 {code}</p>
  ),
}))

vi.mock('@/features/room/manage', () => ({
  RoomActions: ({ participant }: { participant: { nickname: string } }) => (
    <p>방 관리 {participant.nickname}</p>
  ),
}))

const hostParticipant: RoomParticipantResponse = {
  id: 'host-participant-id',
  nickname: '방장님',
  score: 10,
  isReady: false,
  isHost: true,
}

const memberParticipant: RoomParticipantResponse = {
  id: 'member-participant-id',
  nickname: '참가자님',
  score: 5,
  isReady: true,
  isHost: false,
}

const room: RoomDetailResponse = {
  id: 'room-id',
  code: 'ABC234',
  title: '즐거운 그림방',
  status: 'WAITING',
  visibility: 'PUBLIC',
  maxPlayers: 8,
  allowMidJoin: true,
  playerCount: 2,
  host: {
    id: hostParticipant.id,
    nickname: hostParticipant.nickname,
  },
  participants: [hostParticipant, memberParticipant],
  createdAt: '2026-08-26T00:00:00.000Z',
}

function mockQueries(
  options: {
    roomPending?: boolean
    roomError?: boolean
    currentPending?: boolean
    currentError?: boolean
    participant?: RoomParticipantResponse | null
  } = {},
): void {
  mocks.useRoom.mockReturnValue({
    data: room,
    isPending: options.roomPending ?? false,
    isError: options.roomError ?? false,
    refetch: mocks.refetchRoom,
  })
  mocks.useCurrentRoomParticipant.mockReturnValue({
    data: options.participant ?? null,
    isPending: options.currentPending ?? false,
    isError: options.currentError ?? false,
    refetch: mocks.refetchCurrentParticipant,
  })
}

function renderRoomPage(path = '/rooms/ABC234'): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/rooms/:roomCode" element={<RoomPage />} />
        <Route path="/lobby" element={<h1>로비</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RoomPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueries()
  })

  it('올바르지 않은 방 코드를 안내한다', () => {
    renderRoomPage('/rooms/wrong')

    expect(
      screen.getByRole('heading', { name: '올바르지 않은 방 코드입니다.' }),
    ).toBeInTheDocument()
    expect(mocks.useRoom).toHaveBeenCalledWith('')
  })

  it('방과 현재 참가자 정보를 불러오는 동안 로딩 상태를 표시한다', () => {
    mockQueries({ roomPending: true, currentPending: true })
    renderRoomPage()

    expect(
      screen.getByRole('status', { name: '방 정보 불러오는 중' }),
    ).toBeInTheDocument()
  })

  it('방 정보 조회에 실패하면 다시 요청할 수 있다', () => {
    mockQueries({ roomError: true })
    renderRoomPage()
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }))

    expect(mocks.refetchRoom).toHaveBeenCalledOnce()
    expect(mocks.refetchCurrentParticipant).toHaveBeenCalledOnce()
  })

  it('미참가자에게 방 정보와 참가 양식을 표시한다', () => {
    renderRoomPage()

    expect(
      screen.getByRole('heading', { name: '즐거운 그림방' }),
    ).toBeInTheDocument()
    expect(screen.getByText('참가 양식 ABC234')).toBeInTheDocument()
    expect(screen.getByText('방장님')).toBeInTheDocument()
    expect(screen.getByText('준비 완료')).toBeInTheDocument()
  })

  it('참가자에게 본인 표시와 방 관리 기능을 표시한다', () => {
    mockQueries({ participant: memberParticipant })
    renderRoomPage()

    expect(screen.getByText('나')).toBeInTheDocument()
    expect(screen.getByText('방 관리 참가자님')).toBeInTheDocument()
    expect(screen.queryByText('참가 양식 ABC234')).not.toBeInTheDocument()
  })
})
