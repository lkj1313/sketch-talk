import type { JoinRoomRequest } from '@sketch-talk/contracts'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roomQueryKeys } from '@/entities/room'

import { joinRoom } from '../api/join-room'

export function useJoinRoom(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: JoinRoomRequest) => joinRoom(code, request),
    onSuccess: async ({ room, participant }) => {
      queryClient.setQueryData(roomQueryKeys.detail(code), room)
      queryClient.setQueryData(
        roomQueryKeys.currentParticipant(code),
        participant,
      )
      await queryClient.invalidateQueries({ queryKey: roomQueryKeys.all })
    },
  })
}
