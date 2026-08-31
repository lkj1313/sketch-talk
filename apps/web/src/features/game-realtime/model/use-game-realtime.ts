import type {
  GameChatMessageEvent,
  GameReconnectState,
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

type UseGameRealtimeOptions = {
  roomCode: string
  gameId: string
}

type UseGameRealtimeResult = {
  gameState: GameReconnectState | null
  assignedWord: string | null
  messages: GameChatMessageEvent[]
  isConnected: boolean
}

export function useGameRealtime({
  roomCode,
  gameId,
}: UseGameRealtimeOptions): UseGameRealtimeResult {
  const accessToken = useSessionStore((state) => state.accessToken)
  const [gameState, setGameState] = useState<GameReconnectState | null>(null)
  const [assignedWord, setAssignedWord] = useState<string | null>(null)
  const [messages, setMessages] = useState<GameChatMessageEvent[]>([])
  const [isConnected, setIsConnected] = useState(roomSocket.connected)

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
      roomSocket.off(ROOM_SOCKET_EVENT.ERROR, handleRealtimeError)
      disconnectRoomSocket()
    }
  }, [accessToken, gameId, roomCode])

  return { gameState, assignedWord, messages, isConnected }
}
