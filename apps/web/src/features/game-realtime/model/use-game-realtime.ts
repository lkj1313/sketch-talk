import type {
  DrawingClearRequest,
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
  RealtimeErrorResponse,
  RoomSubscribeRequest,
} from '@sketch-talk/contracts'
import { useEffect, useState } from 'react'

import { useSessionStore } from '@/entities/session'
import {
  connectRoomSocket,
  disconnectRoomSocket,
  ROOM_SOCKET_EVENT,
  roomSocket,
} from '@/shared/api'
import { toast } from '@/shared/ui'

const ROUND_RESULT_DISPLAY_DURATION_MS = 3_000

type UseGameRealtimeOptions = {
  roomCode: string
  gameId: string
}

type UseGameRealtimeResult = {
  gameState: GameReconnectState | null
  assignedWord: string | null
  correctAnswer: GameCorrectAnswerEvent | null
  roundTimedOut: GameRoundTimedOutEvent | null
  roundSkipped: GameRoundSkippedEvent | null
  gameResult: GameFinishedEvent | null
  messages: GameChatMessageEvent[]
  drawingStrokes: DrawingStroke[]
  isConnected: boolean
  sendDrawingStroke: (stroke: DrawingStroke) => void
  sendDrawingClear: (roundId: string) => void
}

export function useGameRealtime({
  roomCode,
  gameId,
}: UseGameRealtimeOptions): UseGameRealtimeResult {
  const accessToken = useSessionStore((state) => state.accessToken)
  const [gameState, setGameState] = useState<GameReconnectState | null>(null)
  const [assignedWord, setAssignedWord] = useState<string | null>(null)
  const [correctAnswer, setCorrectAnswer] =
    useState<GameCorrectAnswerEvent | null>(null)
  const [roundTimedOut, setRoundTimedOut] =
    useState<GameRoundTimedOutEvent | null>(null)
  const [roundSkipped, setRoundSkipped] =
    useState<GameRoundSkippedEvent | null>(null)
  const [gameResult, setGameResult] = useState<GameFinishedEvent | null>(null)
  const [messages, setMessages] = useState<GameChatMessageEvent[]>([])
  const [drawingState, setDrawingState] = useState<DrawingSyncEvent | null>(null)
  const [isConnected, setIsConnected] = useState(roomSocket.connected)

  useEffect(() => {
    if (!correctAnswer) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setCorrectAnswer(null)
    }, ROUND_RESULT_DISPLAY_DURATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [correctAnswer])

  useEffect(() => {
    if (!roundTimedOut) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setRoundTimedOut(null)
    }, ROUND_RESULT_DISPLAY_DURATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [roundTimedOut])

  useEffect(() => {
    if (!roundSkipped) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setRoundSkipped(null)
    }, ROUND_RESULT_DISPLAY_DURATION_MS)

    return () => window.clearTimeout(timeoutId)
  }, [roundSkipped])

  useEffect(() => {
    if (!roomCode || !gameId) {
      return
    }

    const subscribeRequest: RoomSubscribeRequest = { code: roomCode }

    function subscribeRoom(): void {
      setIsConnected(true)
      roomSocket.emit(ROOM_SOCKET_EVENT.SUBSCRIBE, subscribeRequest)
    }

    function handleDisconnect(): void {
      setIsConnected(false)
    }

    function handleGameState(state: GameReconnectState): void {
      if (state.gameSessionId !== gameId) {
        return
      }

      setGameState(state)
      setAssignedWord(null)
      setCorrectAnswer(null)
      setRoundTimedOut(null)
      setRoundSkipped(null)
      setGameResult(null)
      setDrawingState({ roundId: state.roundId, strokes: [] })
    }

    function handleWordAssigned(event: GameWordAssignedEvent): void {
      if (event.gameSessionId !== gameId) {
        return
      }

      setAssignedWord(event.answer)
    }

    function handleChatMessage(message: GameChatMessageEvent): void {
      setMessages((currentMessages) => [...currentMessages, message])
    }

    function handleCorrectAnswer(event: GameCorrectAnswerEvent): void {
      if (event.gameSessionId !== gameId) {
        return
      }

      setCorrectAnswer(event)
      setRoundTimedOut(null)
      setRoundSkipped(null)
    }

    function handleRoundStarted(round: GameRoundStartedState): void {
      if (round.gameSessionId !== gameId) {
        return
      }

      setGameState(round)
      setAssignedWord(null)
      setDrawingState({ roundId: round.roundId, strokes: [] })
    }

    function handleRoundTimedOut(event: GameRoundTimedOutEvent): void {
      if (event.gameSessionId !== gameId) {
        return
      }

      setAssignedWord(null)
      setCorrectAnswer(null)
      setRoundTimedOut(event)
      setRoundSkipped(null)
    }

    function handleRoundSkipped(event: GameRoundSkippedEvent): void {
      if (event.gameSessionId !== gameId) {
        return
      }

      setAssignedWord(null)
      setCorrectAnswer(null)
      setRoundTimedOut(null)
      setRoundSkipped(event)
    }

    function handleGameFinished(result: GameFinishedEvent): void {
      if (result.gameSessionId !== gameId) {
        return
      }

      setAssignedWord(null)
      setCorrectAnswer(null)
      setRoundTimedOut(null)
      setRoundSkipped(null)
      setGameResult(result)
      setDrawingState(null)
    }

    function handleDrawingStrokeAdded(stroke: DrawingStroke): void {
      setDrawingState((currentState) => {
        if (!currentState || currentState.roundId !== stroke.roundId) {
          return currentState
        }

        if (
          currentState.strokes.some(
            (currentStroke) => currentStroke.strokeId === stroke.strokeId,
          )
        ) {
          return currentState
        }

        return {
          ...currentState,
          strokes: [...currentState.strokes, stroke],
        }
      })
    }

    function handleDrawingCleared(request: DrawingClearRequest): void {
      setDrawingState((currentState) =>
        currentState?.roundId === request.roundId
          ? { roundId: request.roundId, strokes: [] }
          : currentState,
      )
    }

    function handleDrawingSync(sync: DrawingSyncEvent): void {
      setDrawingState((currentState) =>
        currentState?.roundId === sync.roundId ? sync : currentState,
      )
    }

    function handleRealtimeError(error: RealtimeErrorResponse): void {
      toast.add({
        title: '게임 연결 오류',
        description: error.message,
        type: 'error',
      })
    }

    roomSocket.on('connect', subscribeRoom)
    roomSocket.on('disconnect', handleDisconnect)
    roomSocket.on(ROOM_SOCKET_EVENT.GAME_STATE, handleGameState)
    roomSocket.on(ROOM_SOCKET_EVENT.WORD_ASSIGNED, handleWordAssigned)
    roomSocket.on(ROOM_SOCKET_EVENT.CHAT_MESSAGE, handleChatMessage)
    roomSocket.on(ROOM_SOCKET_EVENT.CORRECT_ANSWER, handleCorrectAnswer)
    roomSocket.on(ROOM_SOCKET_EVENT.ROUND_STARTED, handleRoundStarted)
    roomSocket.on(ROOM_SOCKET_EVENT.ROUND_TIMED_OUT, handleRoundTimedOut)
    roomSocket.on(ROOM_SOCKET_EVENT.ROUND_SKIPPED, handleRoundSkipped)
    roomSocket.on(ROOM_SOCKET_EVENT.GAME_FINISHED, handleGameFinished)
    roomSocket.on(
      ROOM_SOCKET_EVENT.DRAWING_STROKE_ADDED,
      handleDrawingStrokeAdded,
    )
    roomSocket.on(ROOM_SOCKET_EVENT.DRAWING_CLEARED, handleDrawingCleared)
    roomSocket.on(ROOM_SOCKET_EVENT.DRAWING_SYNC, handleDrawingSync)
    roomSocket.on(ROOM_SOCKET_EVENT.ERROR, handleRealtimeError)

    if (roomSocket.connected) {
      subscribeRoom()
    } else {
      connectRoomSocket(accessToken ?? undefined)
    }

    return () => {
      roomSocket.off('connect', subscribeRoom)
      roomSocket.off('disconnect', handleDisconnect)
      roomSocket.off(ROOM_SOCKET_EVENT.GAME_STATE, handleGameState)
      roomSocket.off(ROOM_SOCKET_EVENT.WORD_ASSIGNED, handleWordAssigned)
      roomSocket.off(ROOM_SOCKET_EVENT.CHAT_MESSAGE, handleChatMessage)
      roomSocket.off(ROOM_SOCKET_EVENT.CORRECT_ANSWER, handleCorrectAnswer)
      roomSocket.off(ROOM_SOCKET_EVENT.ROUND_STARTED, handleRoundStarted)
      roomSocket.off(ROOM_SOCKET_EVENT.ROUND_TIMED_OUT, handleRoundTimedOut)
      roomSocket.off(ROOM_SOCKET_EVENT.ROUND_SKIPPED, handleRoundSkipped)
      roomSocket.off(ROOM_SOCKET_EVENT.GAME_FINISHED, handleGameFinished)
      roomSocket.off(
        ROOM_SOCKET_EVENT.DRAWING_STROKE_ADDED,
        handleDrawingStrokeAdded,
      )
      roomSocket.off(ROOM_SOCKET_EVENT.DRAWING_CLEARED, handleDrawingCleared)
      roomSocket.off(ROOM_SOCKET_EVENT.DRAWING_SYNC, handleDrawingSync)
      roomSocket.off(ROOM_SOCKET_EVENT.ERROR, handleRealtimeError)
      disconnectRoomSocket()
    }
  }, [accessToken, gameId, roomCode])

  function sendDrawingStroke(stroke: DrawingStroke): void {
    roomSocket.emit(ROOM_SOCKET_EVENT.DRAWING_STROKE, stroke)
  }

  function sendDrawingClear(roundId: string): void {
    roomSocket.emit(ROOM_SOCKET_EVENT.DRAWING_CLEAR, { roundId })
  }

  return {
    gameState,
    assignedWord,
    correctAnswer,
    roundTimedOut,
    roundSkipped,
    gameResult,
    messages,
    drawingStrokes: drawingState?.strokes ?? [],
    isConnected,
    sendDrawingStroke,
    sendDrawingClear,
  }
}
