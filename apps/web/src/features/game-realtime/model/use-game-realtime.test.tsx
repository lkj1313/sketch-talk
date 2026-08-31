import type {
  GameChatMessageEvent,
  GameCorrectAnswerEvent,
  GameReconnectState,
  GameRoundStartedState,
  GameWordAssignedEvent,
} from '@sketch-talk/contracts'
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useSessionStore } from '@/entities/session'

import { useGameRealtime } from './use-game-realtime'

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
  toastAdd: vi.fn(),
}))

vi.mock('@/shared/api', () => ({
  roomSocket: mocks.socket,
  connectRoomSocket: mocks.connectRoomSocket,
  disconnectRoomSocket: mocks.disconnectRoomSocket,
  ROOM_SOCKET_EVENT: {
    SUBSCRIBE: 'room:subscribe',
    GAME_STATE: 'game:state',
    CHAT_MESSAGE: 'game:chat-message',
    CORRECT_ANSWER: 'game:correct-answer',
    ROUND_STARTED: 'game:round-started',
    WORD_ASSIGNED: 'game:word-assigned',
    ERROR: 'realtime:error',
  },
}))

vi.mock('@/shared/ui', () => ({
  toast: { add: mocks.toastAdd },
}))

const gameState: GameReconnectState = {
  gameSessionId: 'game-id',
  roundId: 'round-id',
  roundNumber: 1,
  totalRounds: 6,
  drawer: { id: 'drawer-id', nickname: '출제자' },
  difficulty: 'EASY',
  startedAt: '2026-08-27T00:00:00.000Z',
  expiresAt: '2026-08-27T00:02:00.000Z',
}

function receive(event: string, payload?: unknown): void {
  act(() => {
    mocks.handlers.get(event)?.(payload)
  })
}

describe('useGameRealtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.handlers.clear()
    mocks.socket.connected = false
    useSessionStore.getState().clearSession()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('소켓 연결 후 현재 방을 구독한다', () => {
    const { result, unmount } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )

    expect(result.current.isConnected).toBe(false)
    expect(mocks.connectRoomSocket).toHaveBeenCalledWith(undefined)

    receive('connect')

    expect(result.current.isConnected).toBe(true)
    expect(mocks.socket.emit).toHaveBeenCalledWith('room:subscribe', {
      code: 'ABC234',
    })

    unmount()

    expect(mocks.disconnectRoomSocket).toHaveBeenCalledOnce()
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'game:state',
      expect.any(Function),
    )
  })

  it('현재 게임과 일치하는 상태와 제시어만 저장한다', () => {
    const { result } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )

    receive('game:state', {
      ...gameState,
      gameSessionId: 'different-game-id',
    } satisfies GameReconnectState)

    expect(result.current.gameState).toBeNull()

    receive('game:state', gameState)
    receive('game:word-assigned', {
      gameSessionId: 'game-id',
      roundId: 'round-id',
      answer: '사과',
    } satisfies GameWordAssignedEvent)

    expect(result.current.gameState).toEqual(gameState)
    expect(result.current.assignedWord).toBe('사과')
  })

  it('서버에서 받은 일반 채팅 메시지를 목록에 추가한다', () => {
    const { result, unmount } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const chatMessage = {
      participant: { id: 'participant-id', nickname: '참가자' },
      message: '안녕하세요',
      sentAt: '2026-08-27T00:00:10.000Z',
    } satisfies GameChatMessageEvent

    expect(result.current.messages).toEqual([])

    receive('game:chat-message', chatMessage)

    expect(result.current.messages).toEqual([chatMessage])

    unmount()
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'game:chat-message',
      expect.any(Function),
    )
  })

  it('현재 게임의 정답 결과만 저장한다', () => {
    const { result, unmount } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const correctAnswer = {
      gameSessionId: 'game-id',
      roundId: 'round-id',
      answer: '사과',
      guesser: {
        id: 'guesser-id',
        nickname: '정답자',
        awardedScore: 100,
      },
      drawer: {
        id: 'drawer-id',
        nickname: '출제자',
        awardedScore: 50,
      },
    } satisfies GameCorrectAnswerEvent

    expect(result.current.correctAnswer).toBeNull()

    receive('game:correct-answer', {
      ...correctAnswer,
      gameSessionId: 'different-game-id',
    } satisfies GameCorrectAnswerEvent)
    expect(result.current.correctAnswer).toBeNull()

    receive('game:correct-answer', correctAnswer)
    expect(result.current.correctAnswer).toEqual(correctAnswer)

    unmount()
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'game:correct-answer',
      expect.any(Function),
    )
  })

  it('정답 결과를 3초 후 초기화한다', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const correctAnswer = {
      gameSessionId: 'game-id',
      roundId: 'round-id',
      answer: '사과',
      guesser: {
        id: 'guesser-id',
        nickname: '정답자',
        awardedScore: 100,
      },
      drawer: {
        id: 'drawer-id',
        nickname: '출제자',
        awardedScore: 50,
      },
    } satisfies GameCorrectAnswerEvent

    receive('game:correct-answer', correctAnswer)
    expect(result.current.correctAnswer).toEqual(correctAnswer)

    act(() => {
      vi.advanceTimersByTime(3_000)
    })

    expect(result.current.correctAnswer).toBeNull()
  })

  it('현재 게임의 다음 라운드 상태를 반영하고 이전 제시어를 제거한다', () => {
    const { result, unmount } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const nextRound = {
      ...gameState,
      roundId: 'next-round-id',
      roundNumber: 2,
      drawer: { id: 'next-drawer-id', nickname: '다음 출제자' },
      difficulty: 'MEDIUM',
      startedAt: '2026-08-27T00:02:00.000Z',
      expiresAt: '2026-08-27T00:04:00.000Z',
    } satisfies GameRoundStartedState

    receive('game:state', gameState)
    receive('game:word-assigned', {
      gameSessionId: 'game-id',
      roundId: 'round-id',
      answer: '사과',
    } satisfies GameWordAssignedEvent)
    receive('game:correct-answer', {
      gameSessionId: 'game-id',
      roundId: 'round-id',
      answer: '사과',
      guesser: {
        id: 'guesser-id',
        nickname: '정답자',
        awardedScore: 100,
      },
      drawer: {
        id: 'drawer-id',
        nickname: '출제자',
        awardedScore: 50,
      },
    } satisfies GameCorrectAnswerEvent)

    receive('game:round-started', {
      ...nextRound,
      gameSessionId: 'different-game-id',
    } satisfies GameRoundStartedState)
    expect(result.current.gameState).toEqual(gameState)
    expect(result.current.assignedWord).toBe('사과')

    receive('game:round-started', nextRound)
    expect(result.current.gameState).toEqual(nextRound)
    expect(result.current.assignedWord).toBeNull()
    expect(result.current.correctAnswer?.answer).toBe('사과')

    unmount()
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'game:round-started',
      expect.any(Function),
    )
  })

  it('연결 종료와 서버 오류를 화면 상태 및 토스트에 반영한다', () => {
    const { result } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )

    receive('connect')
    receive('disconnect')
    receive('realtime:error', {
      code: 'ROOM_PARTICIPANT_NOT_FOUND',
      message: '해당 방에 참가하고 있지 않습니다.',
    })

    expect(result.current.isConnected).toBe(false)
    expect(mocks.toastAdd).toHaveBeenCalledWith({
      title: '게임 연결 오류',
      description: '해당 방에 참가하고 있지 않습니다.',
      type: 'error',
    })
  })

  it('방 코드나 게임 ID가 없으면 연결하지 않는다', () => {
    renderHook(() => useGameRealtime({ roomCode: '', gameId: '' }))

    expect(mocks.socket.on).not.toHaveBeenCalled()
    expect(mocks.connectRoomSocket).not.toHaveBeenCalled()
  })
})
