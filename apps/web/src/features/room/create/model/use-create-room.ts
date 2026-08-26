import { useMutation, useQueryClient } from '@tanstack/react-query'

import { roomQueryKeys } from '@/entities/room'

import { createRoom } from '../api/create-room'

export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRoom,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roomQueryKeys.all })
    },
  })
}
