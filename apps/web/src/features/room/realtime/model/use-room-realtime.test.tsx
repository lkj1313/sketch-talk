import type {
  RoomDetailResponse,
  RoomParticipantResponse,
} from '@sketch-talk/contracts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { roomQueryKeys } from '@/entities/room'
import { useSessionStore } from '@/entities/session'

import { useRoomRealtime } from './use-room-realtime'

type SocketHandler = (payload?: unknown) => void

const mocks = vi.hoisted(() => ({
  handlers: new Map<string, SocketHandler>(),
  socket: {
    connected: false,
    emit: vi.fn(),
    on: vi.fn((event: string, handler: SocketHandler) => {
      mocks.handlers.set(event, handler)
    }),
    off: vi.fn(),
  },
  connectRoomSocket: vi.fn(),
  disconnectRoomSocket: vi.fn(),
  navigate: vi.fn(),
  toastAdd: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  roomSocket: mocks.socket,
  connectRoomSocket: mocks.connectRoomSocket,
  disconnectRoomSocket: mocks.disconnectRoomSocket,
  ROOM_SOCKET_EVENT: {
    SUBSCRIBE: 'room:subscribe',
    STATE: 'room:state',
    PARTICIPANT_JOINED: 'room:participant-joined',
    PARTICIPANT_LEFT: 'room:participant-left',
    HOST_CHANGED: 'room:host-changed',
    READY_CHANGED: 'room:ready-changed',
    GAME_STARTED: 'room:game-started',
    ERROR: 'realtime:error',
  },
}))

vi.mock('@/shared/ui', () => ({
  toast: { add: mocks.toastAdd },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  }
})

const hostParticipant: RoomParticipantResponse = {
  id: 'host-id',
  nickname: '방장',
  score: 0,
  isReady: false,
  isHost: true,
}

const memberParticipant: RoomParticipantResponse = {
  id: 'member-id',
  nickname: '참가자',
  score: 0,
  isReady: false,
  isHost: false,
}

const room: RoomDetailResponse = {
  id: 'room-id',
  code: 'ABC234',
  title: '실시간 방',
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
  createdAt: '2026-08-27T00:00:00.000Z',
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

function receive(event: string, payload?: unknown): void {
  act(() => {
    mocks.handlers.get(event)?.(payload)
  })
}

describe('useRoomRealtime', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.handlers.clear()
    mocks.socket.connected = false
    useSessionStore.getState().clearSession()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(roomQueryKeys.detail(room.code), room)
    queryClient.setQueryData(
      roomQueryKeys.currentParticipant(room.code),
      memberParticipant,
    )
  })

  it('활성화되면 소켓을 연결하고 연결 완료 후 방을 구독한다', () => {
    const { unmount } = renderHook(
      () => useRoomRealtime({ code: room.code, enabled: true }),
      { wrapper: createWrapper(queryClient) },
    )

    expect(mocks.connectRoomSocket).toHaveBeenCalledWith(undefined)

    receive('connect')

    expect(mocks.socket.emit).toHaveBeenCalledWith('room:subscribe', {
      code: room.code,
    })

    unmount()

    expect(mocks.disconnectRoomSocket).toHaveBeenCalledOnce()
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'room:state',
      expect.any(Function),
    )
  })

  it('방에 참가하지 않았다면 소켓을 연결하지 않는다', () => {
    renderHook(() => useRoomRealtime({ code: room.code, enabled: false }), {
      wrapper: createWrapper(queryClient),
    })

    expect(mocks.connectRoomSocket).not.toHaveBeenCalled()
    expect(mocks.socket.on).not.toHaveBeenCalled()
  })

  it('참가·준비·방장·퇴장 이벤트를 방 캐시에 반영한다', () => {
    renderHook(() => useRoomRealtime({ code: room.code, enabled: true }), {
      wrapper: createWrapper(queryClient),
    })

    const newParticipant: RoomParticipantResponse = {
      id: 'new-id',
      nickname: '새 참가자',
      score: 0,
      isReady: false,
      isHost: false,
    }

    receive('room:participant-joined', {
      roomCode: room.code,
      participant: newParticipant,
      playerCount: 3,
    })
    receive('room:ready-changed', {
      roomCode: room.code,
      participant: { ...memberParticipant, isReady: true },
    })
    receive('room:host-changed', {
      roomCode: room.code,
      host: {
        id: memberParticipant.id,
        nickname: memberParticipant.nickname,
      },
    })
    receive('room:participant-left', {
      roomCode: room.code,
      participantId: hostParticipant.id,
      playerCount: 2,
      roomDeleted: false,
    })

    const updatedRoom = queryClient.getQueryData<RoomDetailResponse>(
      roomQueryKeys.detail(room.code),
    )
    const currentParticipant =
      queryClient.getQueryData<RoomParticipantResponse>(
        roomQueryKeys.currentParticipant(room.code),
      )

    expect(updatedRoom?.playerCount).toBe(2)
    expect(updatedRoom?.participants).toHaveLength(2)
    expect(updatedRoom?.participants).not.toContainEqual(hostParticipant)
    expect(updatedRoom?.participants).toContainEqual(newParticipant)
    expect(updatedRoom?.host.id).toBe(memberParticipant.id)
    expect(currentParticipant).toMatchObject({
      id: memberParticipant.id,
      isReady: true,
      isHost: true,
    })
  })

  it('게임 시작 시 최신 방을 저장하고 게임 화면으로 이동한다', () => {
    renderHook(() => useRoomRealtime({ code: room.code, enabled: true }), {
      wrapper: createWrapper(queryClient),
    })
    const playingRoom: RoomDetailResponse = {
      ...room,
      status: 'PLAYING',
    }

    receive('room:game-started', {
      roomCode: room.code,
      room: playingRoom,
      game: {
        gameSessionId: 'game-id',
        roundId: 'round-id',
        roundNumber: 1,
        totalRounds: 6,
        drawer: { id: hostParticipant.id, nickname: hostParticipant.nickname },
        difficulty: 'EASY',
        startedAt: '2026-08-27T00:00:00.000Z',
        expiresAt: '2026-08-27T00:02:00.000Z',
      },
    })

    expect(queryClient.getQueryData(roomQueryKeys.detail(room.code))).toEqual(
      playingRoom,
    )
    expect(mocks.navigate).toHaveBeenCalledWith(
      '/rooms/ABC234/games/game-id',
    )
  })

  it('실시간 오류를 토스트로 안내하고 방 삭제 시 로비로 이동한다', () => {
    renderHook(() => useRoomRealtime({ code: room.code, enabled: true }), {
      wrapper: createWrapper(queryClient),
    })

    receive('realtime:error', {
      code: 'ROOM_PARTICIPANT_NOT_FOUND',
      message: '해당 방에 참가하고 있지 않습니다.',
    })
    receive('room:participant-left', {
      roomCode: room.code,
      participantId: hostParticipant.id,
      playerCount: 0,
      roomDeleted: true,
    })

    expect(mocks.toastAdd).toHaveBeenCalledWith({
      title: '실시간 연결 오류',
      description: '해당 방에 참가하고 있지 않습니다.',
      type: 'error',
    })
    expect(mocks.navigate).toHaveBeenCalledWith('/lobby', { replace: true })
    expect(
      queryClient.getQueryData(roomQueryKeys.detail(room.code)),
    ).toBeUndefined()
  })
})
