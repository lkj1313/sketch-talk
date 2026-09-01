import type {
  DrawingStroke,
  DrawingSyncEvent,
  GameChatMessageEvent,
  GameCorrectAnswerEvent,
  GameFinishedEvent,
  GameReconnectState,
  GameRoundSkippedEvent,
  GameRoundStartedState,
  GameRoundTimedOutEvent,
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
    ROUND_TIMED_OUT: 'game:round-timed-out',
    ROUND_SKIPPED: 'game:round-skipped',
    GAME_FINISHED: 'game:finished',
    WORD_ASSIGNED: 'game:word-assigned',
    DRAWING_STROKE: 'drawing:stroke',
    DRAWING_STROKE_ADDED: 'drawing:stroke-added',
    DRAWING_CLEAR: 'drawing:clear',
    DRAWING_CLEARED: 'drawing:cleared',
    DRAWING_SYNC: 'drawing:sync',
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

  it('현재 라운드의 시간 초과 결과를 저장하고 3초 후 제거한다', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const timedOut = {
      gameSessionId: 'game-id',
      roundId: 'round-id',
      answer: '사과',
    } satisfies GameRoundTimedOutEvent

    receive('game:round-timed-out', {
      ...timedOut,
      gameSessionId: 'different-game-id',
    } satisfies GameRoundTimedOutEvent)
    expect(result.current.roundTimedOut).toBeNull()

    receive('game:round-timed-out', timedOut)
    expect(result.current.roundTimedOut).toEqual(timedOut)

    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    expect(result.current.roundTimedOut).toBeNull()

    unmount()
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'game:round-timed-out',
      expect.any(Function),
    )
  })

  it('현재 게임의 종료 결과를 저장한다', () => {
    const { result, unmount } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const gameResult = {
      gameSessionId: 'game-id',
      scores: [
        { participantId: 'participant-id', nickname: '참가자', score: 300 },
      ],
      endedAt: '2026-08-31T10:10:00.000Z',
    } satisfies GameFinishedEvent

    receive('game:finished', {
      ...gameResult,
      gameSessionId: 'different-game-id',
    } satisfies GameFinishedEvent)
    expect(result.current.gameResult).toBeNull()

    receive('game:finished', gameResult)
    expect(result.current.gameResult).toEqual(gameResult)
    expect(result.current.assignedWord).toBeNull()
    expect(result.current.correctAnswer).toBeNull()
    expect(result.current.roundTimedOut).toBeNull()
    expect(result.current.drawingStrokes).toEqual([])

    unmount()
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'game:finished',
      expect.any(Function),
    )
  })

  it('그림 동기화와 새 선을 현재 라운드에만 반영한다', () => {
    const { result, unmount } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const firstStroke = {
      roundId: 'round-id',
      strokeId: 'first-stroke-id',
      tool: 'PEN',
      color: '#111827',
      width: 4,
      points: [
        { x: 0.1, y: 0.2 },
        { x: 0.3, y: 0.4 },
      ],
    } satisfies DrawingStroke
    const secondStroke = {
      ...firstStroke,
      strokeId: 'second-stroke-id',
      color: '#ef4444',
    } satisfies DrawingStroke

    receive('game:state', gameState)
    receive('drawing:sync', {
      roundId: 'round-id',
      strokes: [firstStroke],
    } satisfies DrawingSyncEvent)

    expect(result.current.drawingStrokes).toEqual([firstStroke])

    receive('drawing:stroke-added', secondStroke)
    receive('drawing:stroke-added', secondStroke)
    receive('drawing:stroke-added', {
      ...secondStroke,
      roundId: 'different-round-id',
      strokeId: 'different-round-stroke-id',
    } satisfies DrawingStroke)

    expect(result.current.drawingStrokes).toEqual([firstStroke, secondStroke])

    unmount()
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'drawing:sync',
      expect.any(Function),
    )
  })

  it('전체 지우기와 새 라운드를 그림 상태에 반영한다', () => {
    const { result } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const stroke = {
      roundId: 'round-id',
      strokeId: 'stroke-id',
      tool: 'PEN',
      color: '#111827',
      width: 4,
      points: [{ x: 0.1, y: 0.2 }],
    } satisfies DrawingStroke

    receive('game:state', gameState)
    receive('drawing:sync', {
      roundId: 'round-id',
      strokes: [stroke],
    } satisfies DrawingSyncEvent)
    receive('drawing:cleared', { roundId: 'different-round-id' })
    expect(result.current.drawingStrokes).toEqual([stroke])

    receive('drawing:cleared', { roundId: 'round-id' })
    expect(result.current.drawingStrokes).toEqual([])

    receive('game:round-started', {
      ...gameState,
      roundId: 'next-round-id',
      roundNumber: 2,
    } satisfies GameRoundStartedState)
    receive('drawing:stroke-added', stroke)

    expect(result.current.drawingStrokes).toEqual([])
  })

  it('완성된 선과 전체 지우기 요청을 서버로 전송한다', () => {
    const { result } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const stroke = {
      roundId: 'round-id',
      strokeId: 'stroke-id',
      tool: 'ERASER',
      color: '#111827',
      width: 20,
      points: [{ x: 0.5, y: 0.5 }],
    } satisfies DrawingStroke

    act(() => {
      result.current.sendDrawingStroke(stroke)
      result.current.sendDrawingClear('round-id')
    })

    expect(mocks.socket.emit).toHaveBeenCalledWith('drawing:stroke', stroke)
    expect(mocks.socket.emit).toHaveBeenCalledWith('drawing:clear', {
      roundId: 'round-id',
    })
  })

  it('현재 라운드의 건너뛰기 결과를 저장하고 3초 후 제거한다', () => {
    vi.useFakeTimers()
    const { result, unmount } = renderHook(() =>
      useGameRealtime({ roomCode: 'ABC234', gameId: 'game-id' }),
    )
    const skipped = {
      gameSessionId: 'game-id',
      roundId: 'round-id',
      answer: '사과',
      reason: 'DRAWER_LEFT',
    } satisfies GameRoundSkippedEvent

    receive('game:round-skipped', {
      ...skipped,
      gameSessionId: 'different-game-id',
    } satisfies GameRoundSkippedEvent)
    expect(result.current.roundSkipped).toBeNull()

    receive('game:round-skipped', skipped)
    expect(result.current.roundSkipped).toEqual(skipped)
    expect(result.current.assignedWord).toBeNull()

    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    expect(result.current.roundSkipped).toBeNull()

    unmount()
    expect(mocks.socket.off).toHaveBeenCalledWith(
      'game:round-skipped',
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
