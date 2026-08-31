import type { RoomDetailResponse } from '@sketch-talk/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roomQueryKeys } from '@/entities/room'

import { leaveRoom, startRoom, updateReady } from '../api/manage-room'

export function useUpdateReady(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (isReady: boolean) => updateReady(code, { isReady }),
    onSuccess: (participant) => {
      queryClient.setQueryData(
        roomQueryKeys.currentParticipant(code),
        participant,
      )
      queryClient.setQueryData<RoomDetailResponse>(
        roomQueryKeys.detail(code),
        (room) =>
          room
            ? {
                ...room,
                participants: room.participants.map((item) =>
                  item.id === participant.id ? participant : item,
                ),
              }
            : room,
      )
    },
  })
}

export function useLeaveRoom(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => leaveRoom(code),
    onSuccess: async () => {
      queryClient.setQueryData(roomQueryKeys.currentParticipant(code), null)
      await queryClient.invalidateQueries({ queryKey: roomQueryKeys.all })
    },
  })
}

export function useStartRoom(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => startRoom(code),
    onSuccess: async (room) => {
      queryClient.setQueryData(roomQueryKeys.detail(code), room)
      await queryClient.invalidateQueries({ queryKey: roomQueryKeys.all })
    },
  })
}
