import type {
  RealtimeErrorResponse,
  RoomDetailResponse,
  RoomGameStartedEvent,
  RoomHostChangedEvent,
  RoomParticipantJoinedEvent,
  RoomParticipantLeftEvent,
  RoomParticipantResponse,
  RoomReadyChangedEvent,
  RoomSubscribeRequest,
} from '@sketch-talk/contracts'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { roomQueryKeys } from '@/entities/room'
import { useSessionStore } from '@/entities/session'
import {
  connectRoomSocket,
  disconnectRoomSocket,
  ROOM_SOCKET_EVENT,
  roomSocket,
} from '@/shared/api'
import { toast } from '@/shared/ui'

type UseRoomRealtimeOptions = {
  code: string
  enabled: boolean
}

export function useRoomRealtime({ code, enabled }: UseRoomRealtimeOptions): void {
  const accessToken = useSessionStore((state) => state.accessToken)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  useEffect(() => {
    if (!enabled || !code) {
      return
    }

    const subscribeRequest: RoomSubscribeRequest = { code }

    function subscribeRoom(): void {
      roomSocket.emit(ROOM_SOCKET_EVENT.SUBSCRIBE, subscribeRequest)
    }

    function handleRoomState(room: RoomDetailResponse): void {
      queryClient.setQueryData(roomQueryKeys.detail(code), room)
    }

    function handleParticipantJoined(
      event: RoomParticipantJoinedEvent,
    ): void {
      if (event.roomCode !== code) {
        return
      }

      queryClient.setQueryData<RoomDetailResponse>(
        roomQueryKeys.detail(code),
        (room) => {
          if (!room) {
            return room
          }

          const participantExists = room.participants.some(
            (participant) => participant.id === event.participant.id,
          )

          return {
            ...room,
            playerCount: event.playerCount,
            participants: participantExists
              ? room.participants.map((participant) =>
                  participant.id === event.participant.id
                    ? event.participant
                    : participant,
                )
              : [...room.participants, event.participant],
          }
        },
      )
      void queryClient.invalidateQueries({ queryKey: roomQueryKeys.lists })
    }

    function handleParticipantLeft(event: RoomParticipantLeftEvent): void {
      if (event.roomCode !== code) {
        return
      }

      if (event.roomDeleted) {
        queryClient.removeQueries({ queryKey: roomQueryKeys.detail(code) })
        void queryClient.invalidateQueries({ queryKey: roomQueryKeys.lists })
        toast.add({
          title: '방이 종료되었습니다.',
          description: '마지막 참가자가 나가 방이 삭제되었습니다.',
          type: 'error',
        })
        void navigate('/lobby', { replace: true })
        return
      }

      queryClient.setQueryData<RoomDetailResponse>(
        roomQueryKeys.detail(code),
        (room) =>
          room
            ? {
                ...room,
                playerCount: event.playerCount,
                participants: room.participants.filter(
                  (participant) => participant.id !== event.participantId,
                ),
              }
            : room,
      )
      void queryClient.invalidateQueries({ queryKey: roomQueryKeys.lists })
    }

    function handleHostChanged(event: RoomHostChangedEvent): void {
      if (event.roomCode !== code) {
        return
      }

      queryClient.setQueryData<RoomDetailResponse>(
        roomQueryKeys.detail(code),
        (room) =>
          room
            ? {
                ...room,
                host: event.host,
                participants: room.participants.map((participant) => ({
                  ...participant,
                  isHost: participant.id === event.host.id,
                })),
              }
            : room,
      )
      queryClient.setQueryData<RoomParticipantResponse | null>(
        roomQueryKeys.currentParticipant(code),
        (participant) =>
          participant
            ? {
                ...participant,
                isHost: participant.id === event.host.id,
              }
            : participant,
      )
    }

    function handleReadyChanged(event: RoomReadyChangedEvent): void {
      if (event.roomCode !== code) {
        return
      }

      queryClient.setQueryData<RoomDetailResponse>(
        roomQueryKeys.detail(code),
        (room) =>
          room
            ? {
                ...room,
                participants: room.participants.map((participant) =>
                  participant.id === event.participant.id
                    ? event.participant
                    : participant,
                ),
              }
            : room,
      )
      queryClient.setQueryData<RoomParticipantResponse | null>(
        roomQueryKeys.currentParticipant(code),
        (participant) =>
          participant?.id === event.participant.id
            ? event.participant
            : participant,
      )
    }

    function handleGameStarted(event: RoomGameStartedEvent): void {
      if (event.roomCode !== code) {
        return
      }

      queryClient.setQueryData(roomQueryKeys.detail(code), event.room)
      void queryClient.invalidateQueries({ queryKey: roomQueryKeys.lists })
      void navigate(
        `/rooms/${event.roomCode}/games/${event.game.gameSessionId}`,
      )
    }

    function handleRealtimeError(error: RealtimeErrorResponse): void {
      toast.add({
        title: '실시간 연결 오류',
        description: error.message,
        type: 'error',
      })
    }

    roomSocket.on('connect', subscribeRoom)
    roomSocket.on(ROOM_SOCKET_EVENT.STATE, handleRoomState)
    roomSocket.on(
      ROOM_SOCKET_EVENT.PARTICIPANT_JOINED,
      handleParticipantJoined,
    )
    roomSocket.on(ROOM_SOCKET_EVENT.PARTICIPANT_LEFT, handleParticipantLeft)
    roomSocket.on(ROOM_SOCKET_EVENT.HOST_CHANGED, handleHostChanged)
    roomSocket.on(ROOM_SOCKET_EVENT.READY_CHANGED, handleReadyChanged)
    roomSocket.on(ROOM_SOCKET_EVENT.GAME_STARTED, handleGameStarted)
    roomSocket.on(ROOM_SOCKET_EVENT.ERROR, handleRealtimeError)

    if (roomSocket.connected) {
      subscribeRoom()
    } else {
      connectRoomSocket(accessToken ?? undefined)
    }

    return () => {
      roomSocket.off('connect', subscribeRoom)
      roomSocket.off(ROOM_SOCKET_EVENT.STATE, handleRoomState)
      roomSocket.off(
        ROOM_SOCKET_EVENT.PARTICIPANT_JOINED,
        handleParticipantJoined,
      )
      roomSocket.off(
        ROOM_SOCKET_EVENT.PARTICIPANT_LEFT,
        handleParticipantLeft,
      )
      roomSocket.off(ROOM_SOCKET_EVENT.HOST_CHANGED, handleHostChanged)
      roomSocket.off(ROOM_SOCKET_EVENT.READY_CHANGED, handleReadyChanged)
      roomSocket.off(ROOM_SOCKET_EVENT.GAME_STARTED, handleGameStarted)
      roomSocket.off(ROOM_SOCKET_EVENT.ERROR, handleRealtimeError)
      disconnectRoomSocket()
    }
  }, [accessToken, code, enabled, navigate, queryClient])
}
